// src/lib/rankCache.ts
import { getRanksByPuuid, getRiotTFTStats } from '@/src/lib/riot';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 година

export async function refreshRankIfNeeded(
  supabaseRead: any,
  userId: string,
  game: 'lol' | 'tft' | 'valorant',
) {
  // ─── Читаємо профіль ────────────────────────────────────────────────────
  const { data: profile, error } = await supabaseRead
    .from('profiles')
    .select('game_profiles')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('[rankCache] profile not found:', error);
    return null;
  }

  const gameProfiles = profile.game_profiles || {};
  const gameProfile = gameProfiles[game] || {};
  const puuid: string | null = gameProfile.puuid ?? null;
  const region: string = gameProfile.region || 'EUW';
  const lastUpdated: string | null = gameProfile.rank_updated_at ?? null;

  // ─── Перевірка кешу ─────────────────────────────────────────────────────
  if (lastUpdated) {
    const elapsed = Date.now() - new Date(lastUpdated).getTime();
    if (elapsed < CACHE_TTL_MS) {
      console.log('[rankCache] returning cached data for', game);
      return { cached: true, data: extractCachedRank(gameProfile, game) };
    }
  }

  // ─── Немає puuid або valorant → повертаємо з БД ──────────────────────────
  if (!puuid || game === 'valorant') {
    return { cached: true, data: extractCachedRank(gameProfile, game) };
  }

  // ─── Запит до Riot API ───────────────────────────────────────────────────
  console.log('[rankCache] fetching from Riot for', game, puuid);
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
  }

  // ─── Зберігаємо через Supabase REST API з service role ───────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const updatedGameProfiles = {
    ...gameProfiles,
    [game]: { ...gameProfile, ...updatedFields },
  };

  const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ game_profiles: updatedGameProfiles }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[rankCache] write failed:', res.status, text);
    return { cached: true, data: extractCachedRank(gameProfile, game) };
  }

  console.log('[rankCache] successfully updated rank for', game, userId);
  return { cached: false, data: updatedFields };
}

function extractCachedRank(gameProfile: Record<string, any>, game: string) {
  if (game === 'lol') {
    return {
      solo:        gameProfile.rank,
      flex:        gameProfile.flex_rank,
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