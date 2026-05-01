import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import { getRanksByPuuid, getRiotTFTStats } from '@/src/lib/riot';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 година

// Anon client — для читання (підпадає під RLS)
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Service role client — для запису (обходить RLS, тільки на сервері!)
// Ключ: Supabase → Project Settings → API → service_role
function createServiceClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId, game } = await req.json();
    if (!userId || !game) {
      return NextResponse.json({ error: 'Missing userId or game' }, { status: 400 });
    }

    const supabase = createClient();
    const supabaseAdmin = createServiceClient();

    // ─── Беремо профіль з БД ──────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('game_profiles')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const gameProfiles = profile.game_profiles || {};
    const gameProfile = gameProfiles[game] || {};
    const puuid: string | null = gameProfile.puuid ?? null;
    const region: string = gameProfile.region || 'EUW';

    // ─── Перевірка кешу (1 година) ────────────────────────────────────────
    const lastUpdated: string | null = gameProfile.rank_updated_at ?? null;
    if (lastUpdated) {
      const elapsed = Date.now() - new Date(lastUpdated).getTime();
      if (elapsed < CACHE_TTL_MS) {
        return NextResponse.json({
          cached: true,
          updatedAt: lastUpdated,
          data: extractCachedRank(gameProfile, game),
        });
      }
    }

    // ─── Немає puuid → повертаємо закешоване (або пусто) ─────────────────
    if (!puuid) {
      return NextResponse.json({
        cached: true,
        updatedAt: lastUpdated,
        data: extractCachedRank(gameProfile, game),
      });
    }

    // ─── Valorant: публічний API для рангу недоступний ────────────────────
    if (game === 'valorant') {
      return NextResponse.json({
        cached: true,
        updatedAt: lastUpdated,
        data: extractCachedRank(gameProfile, game),
      });
    }

    // ─── Запит до Riot API ────────────────────────────────────────────────
    let updatedFields: Record<string, any> = {};

    if (game === 'lol') {
      const stats = await getRanksByPuuid(puuid, region);
      updatedFields = {
        rank:            stats.solo,
        flex_rank:       stats.flex,
        solo_wins:       stats.solo_wins,
        solo_losses:     stats.solo_losses,
        flex_wins:       stats.flex_wins,
        flex_losses:     stats.flex_losses,
        rank_updated_at: new Date().toISOString(),
      };
    } else if (game === 'tft') {
      const stats = await getRiotTFTStats(puuid, region);
      updatedFields = {
        rank:            stats.rank,
        wins:            stats.wins,
        losses:          stats.losses,
        rank_updated_at: new Date().toISOString(),
      };
    } else {
      return NextResponse.json({ error: 'Unknown game' }, { status: 400 });
    }

    // ─── Зберігаємо в БД через service role (обходить RLS) ───────────────
    const updatedGameProfiles = {
      ...gameProfiles,
      [game]: { ...gameProfile, ...updatedFields },
    };

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ game_profiles: updatedGameProfiles })
      .eq('id', userId);

    if (updateError) {
      console.error('[rank-refresh] DB update error:', updateError);
      return NextResponse.json({ error: 'Failed to save rank' }, { status: 500 });
    }

    return NextResponse.json({
      cached: false,
      updatedAt: updatedFields.rank_updated_at,
      data: updatedFields,
    });

  } catch (err) {
    console.error('[rank-refresh] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Хелпер: витягуємо закешовані дані з game_profiles ───────────────────
function extractCachedRank(gameProfile: Record<string, any>, game: string) {
  if (game === 'lol') {
    return {
      rank:        gameProfile.rank,
      flex_rank:   gameProfile.flex_rank,
      solo_wins:   gameProfile.solo_wins   ?? 0,
      solo_losses: gameProfile.solo_losses ?? 0,
      flex_wins:   gameProfile.flex_wins   ?? 0,
      flex_losses: gameProfile.flex_losses ?? 0,
    };
  }
  if (game === 'tft') {
    return {
      rank:   gameProfile.rank,
      wins:   gameProfile.wins   ?? 0,
      losses: gameProfile.losses ?? 0,
    };
  }
  if (game === 'valorant') {
    return {
      rank:   gameProfile.rank,
      wins:   gameProfile.wins   ?? 0,
      losses: gameProfile.losses ?? 0,
    };
  }
  return {};
}