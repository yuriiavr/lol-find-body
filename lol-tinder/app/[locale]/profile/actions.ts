'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { 
  getAccountByRiotId,
  getRanksByPuuid,
  getRiotTFTStats,
  getTopChampions,
} from '@/src/lib/riot'
import { getGameProfile, buildGameUpdate, getGameName, getTagLine, getRegion, getExtra, getRank } from '@/src/lib/profile'
import { refreshRankIfNeeded } from '@/src/lib/rankCache'
// Defined here to avoid circular import — must match OtherGamesForm.tsx
export type OtherGameEntry = {
  game_id: string
  game_name: string
  skill_level: string
  bio: string
  /** Whether this entry is shown in the /another discovery feed.
   *  Older rows without this field are treated as visible (back-compat). */
  visible?: boolean
}

// ─── Supabase клієнти ────────────────────────────────────────────────────────
async function createCookieClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set(name, value, options) },
        remove(name: string, options: CookieOptions) { cookieStore.delete(name) },
      },
    }
  )
}

// ─── getRanksByPuuidAction ────────────────────────────────────────────────────
export async function getRanksByPuuidAction(puuid: string, region: string) {
  const supabase = await createCookieClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .filter('game_profiles->lol->>puuid', 'eq', puuid)
    .maybeSingle()

  if (profiles?.id) {
    const result = await refreshRankIfNeeded(supabase, profiles.id, 'lol')
    if (result) return result.data
  }

  return await getRanksByPuuid(puuid, region)
}

// ─── getRiotTFTStatsAction ────────────────────────────────────────────────────
export async function getRiotTFTStatsAction(puuid: string, region: string) {
  const supabase = await createCookieClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, game_profiles')
    .filter('game_profiles->tft->>puuid', 'eq', puuid)
    .maybeSingle()

  if (profiles?.id) {
    const result = await refreshRankIfNeeded(supabase, profiles.id, 'tft')
    if (result) {
      // Auto-міграція: якщо ранг UNRANKED, а у нас є збережений Riot ID —
      // спробуємо переретайнути puuid через TFT-ключ (попередній міг бути
      // lol-shifted з старої sync-логіки). Один раз — якщо новий рейз дає
      // не-UNRANKED, оновлюємо БД.
      const data: any = result.data
      if (data?.rank === 'UNRANKED' || data?.rank === 'Unranked') {
        const tftProfile = profiles.game_profiles?.tft
        const gName = tftProfile?.game_name
        const tagLine = tftProfile?.tag_line
        const tftRegion = tftProfile?.region || region
        if (gName && tagLine) {
          const account = await getAccountByRiotId(gName, tagLine, tftRegion, 'tft')
          if (account && account.puuid !== puuid) {
            const fresh = await getRiotTFTStats(account.puuid, tftRegion)
            if (fresh.rank !== 'UNRANKED') {
              // Записуємо свіжий TFT-puuid + ранг у БД
              await supabase
                .from('profiles')
                .update({
                  game_profiles: {
                    ...profiles.game_profiles,
                    tft: {
                      ...tftProfile,
                      puuid: account.puuid,
                      rank: fresh.rank,
                      wins: fresh.wins,
                      losses: fresh.losses,
                      rank_updated_at: new Date().toISOString(),
                    },
                  },
                })
                .eq('id', profiles.id)
              return fresh
            }
          }
        }
      }
      return data
    }
  }

  return await getRiotTFTStats(puuid, region)
}

// ─── getTopChampionsAction ────────────────────────────────────────────────────
export async function getTopChampionsAction(puuid: string, region: string) {
  const supabase = await createCookieClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .filter('game_profiles->lol->>puuid', 'eq', puuid)
    .maybeSingle()

  if (profiles?.id) {
    const result = await refreshRankIfNeeded(supabase, profiles.id, 'lol')
    if (result && result.data?.top_champions?.length > 0) return result.data.top_champions
  }

  return await getTopChampions(puuid, region)
}

// ─── upsertCustomGames ────────────────────────────────────────────────────────
// Keeps the `custom_games` registry in sync with what users put on their
// profile.game_profiles.other. Identifies rows by game_name (case-insensitive)
// since the table only has (id, game_name, player_count) — no slug column.
async function upsertCustomGames(
  supabase: Awaited<ReturnType<typeof createCookieClient>>,
  newEntries: OtherGameEntry[],
  keptEntries: OtherGameEntry[],
  removedEntries: OtherGameEntry[],
) {
  console.log('[custom_games] upsertCustomGames called with', {
    newEntries: newEntries.map(e => e.game_name),
    keptEntries: keptEntries.map(e => e.game_name),
    removedEntries: removedEntries.map(e => e.game_name),
  })

  // ── 1. Newly added games on the profile → +1 (or insert with count=1)
  for (const entry of newEntries) {
    const name = entry.game_name?.trim()
    if (!name) continue

    const lookup = await supabase
      .from('custom_games')
      .select('id, player_count')
      .ilike('game_name', name)
      .limit(1)
      .maybeSingle()

    if (lookup.error) {
      console.error('[custom_games] lookup failed for', name, lookup.error)
      continue
    }

    if (lookup.data) {
      const upd = await supabase
        .from('custom_games')
        .update({ player_count: (lookup.data.player_count ?? 0) + 1 })
        .eq('id', lookup.data.id)
      console.log('[custom_games] +1', name, 'error:', upd.error)
    } else {
      const ins = await supabase
        .from('custom_games')
        .insert({ game_name: name, player_count: 1 })
        .select()
      console.log('[custom_games] INSERT', name, 'data:', ins.data, 'error:', ins.error)
    }
  }

  // ── 2. Kept games (already on profile) → backfill row if missing,
  //       without changing the count (the user was already counted before).
  for (const entry of keptEntries) {
    const name = entry.game_name?.trim()
    if (!name) continue

    const lookup = await supabase
      .from('custom_games')
      .select('id')
      .ilike('game_name', name)
      .limit(1)
      .maybeSingle()

    if (lookup.error) {
      console.error('[custom_games] backfill lookup failed for', name, lookup.error)
      continue
    }

    if (!lookup.data) {
      // The row never made it into custom_games (earlier INSERT failed).
      // Default to player_count=1 since at least this user has it. If actual
      // player counts are needed, run a recalc SQL once (see comments below).
      const ins = await supabase
        .from('custom_games')
        .insert({ game_name: name, player_count: 1 })
        .select()
      console.log('[custom_games] BACKFILL', name, 'data:', ins.data, 'error:', ins.error)
    }
  }

  // ── 3. Removed games → -1, or DELETE the row entirely if it would hit 0.
  for (const entry of removedEntries) {
    const name = entry.game_name?.trim()
    if (!name) continue

    const lookup = await supabase
      .from('custom_games')
      .select('id, player_count')
      .ilike('game_name', name)
      .limit(1)
      .maybeSingle()

    if (lookup.error || !lookup.data) continue

    const newCount = (lookup.data.player_count ?? 0) - 1
    if (newCount <= 0) {
      const del = await supabase
        .from('custom_games')
        .delete()
        .eq('id', lookup.data.id)
        .select()
      console.log('[custom_games] DELETE', name, 'rows:', del.data?.length ?? 0, 'error:', del.error)
      if ((del.data?.length ?? 0) === 0 && !del.error) {
        console.warn('[custom_games] DELETE returned 0 rows — likely missing RLS DELETE policy on custom_games')
      }
    } else {
      const upd = await supabase
        .from('custom_games')
        .update({ player_count: newCount })
        .eq('id', lookup.data.id)
        .select()
      console.log('[custom_games] -1', name, '→', newCount, 'rows:', upd.data?.length ?? 0, 'error:', upd.error)
    }
  }
}

// ─── updateProfile ────────────────────────────────────────────────────────────
export async function updateProfile(
  formData: FormData,
  otherGames?: OtherGameEntry[],   // passed separately — not serialisable in FormData as JSON
) {
  const supabase = await createCookieClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: currentProf } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const activeGame   = formData.get('activeGame') as string
  const activeKey    = activeGame.toLowerCase() as 'lol' | 'tft' | 'valorant' | 'cs2'
  
  const display_name = (formData.get('display_name') as string)?.trim() || (currentProf as any)?.display_name || ''

  let gName = '', tLine = '', gRegion = 'EUW';
  let puuid: string | null = null;
  let apiRank: string | null = null;
  let tftApiStats: { rank: string; wins: number; losses: number } | null = null;

  if (activeGame === 'CS2') {
    gName = '';
    tLine = '';
    gRegion = '';
  } else if (activeGame === 'LOL' || activeGame === 'TFT') {
    const lolGameName = getGameName(currentProf, 'lol');
    const tftGameName = getGameName(currentProf, 'tft');
    gName   = (formData.get('riot_game_name') as string)?.trim() || lolGameName || tftGameName || '';
    tLine   = (formData.get('riot_tag_line') as string)?.trim().replace('#', '') || getTagLine(currentProf, 'lol') || getTagLine(currentProf, 'tft') || '';
    gRegion = (formData.get('riot_region') as string) || getRegion(currentProf, 'lol') || getRegion(currentProf, 'tft') || 'EUW';
  } else {
    // VALORANT
    const valGameName = getGameName(currentProf, 'valorant');
    gName   = (formData.get('val_game_name') as string)?.trim() || valGameName || '';
    tLine   = (formData.get('val_tag_line') as string)?.trim().replace('#', '') || getTagLine(currentProf, 'valorant') || '';
    gRegion = (formData.get('val_region') as string) || getRegion(currentProf, 'valorant') || 'EUW';
  }

  const bio          = formData.get('bio') as string
  const role         = formData.get('role') as string
  const language     = formData.get('language') as string
  const preferred_queue = formData.get('queues') as string
  const enabled_games = formData.get('enabled_games') as string
  const visible_games = formData.get('visible_games') as string
  const hasMicRaw     = formData.get('has_mic') ?? formData.get('hasMic')
  const hasMic        = hasMicRaw !== null ? (hasMicRaw === 'true' || hasMicRaw === 'on') : ((currentProf as any)?.has_mic ?? true)
  const isPaused     = formData.get('isPaused') === 'on'

  const existingGameProfile = getGameProfile(currentProf, activeKey);

  // ─── Riot account resolution (skip for CS2) ───────────────────────────────
  // Важливо: Riot шифрує PUUID per-key, тож LOL-puuid не валідний для TFT
  // API і навпаки. Резолвимо account окремо під ключ кожної гри.
  if (activeGame === 'LOL') {
    puuid = getExtra(currentProf, 'lol', 'puuid') || null;
    const hasRiotChanged = (gName !== getGameName(currentProf, 'lol')) || (tLine !== getTagLine(currentProf, 'lol')) || (gRegion !== getRegion(currentProf, 'lol'));

    if (hasRiotChanged) puuid = null;

    if (gName && tLine && !puuid) {
      const account = await getAccountByRiotId(gName, tLine, gRegion, 'lol');
      if (account) {
        puuid = account.puuid;
      } else {
        return { error: `Account not found: ${gName}#${tLine} in ${gRegion}` };
      }
    }

    if (puuid) {
      const ranks = await getRanksByPuuid(puuid, gRegion)
      if (ranks) {
        apiRank = ranks.solo !== 'UNRANKED' ? ranks.solo : ranks.flex;
      }
    }
  } else if (activeGame === 'TFT') {
    // TFT-puuid у БД може бути «LoL-shifted» з попередніх збережень (стара
    // sync-логіка). Якщо Riot ID не змінився, спробуємо переставити збережений
    // — інакше резолвимо account ще раз через TFT-ключ.
    const storedPuuid = getExtra(currentProf, 'tft', 'puuid') || null;
    const hasRiotChanged = (gName !== getGameName(currentProf, 'tft')) || (tLine !== getTagLine(currentProf, 'tft')) || (gRegion !== getRegion(currentProf, 'tft'));

    puuid = hasRiotChanged ? null : storedPuuid;

    if (gName && tLine) {
      // Завжди резолвимо TFT account через TFT-ключ — це cheap (cached 24h)
      // і гарантує правильний per-key encrypted PUUID.
      const account = await getAccountByRiotId(gName, tLine, gRegion, 'tft');
      if (account) {
        puuid = account.puuid;
      } else if (!puuid) {
        return { error: `Account not found: ${gName}#${tLine} in ${gRegion}` };
      }
    }

    if (puuid) {
      tftApiStats = await getRiotTFTStats(puuid, gRegion);
    }
  }

  const isGameVisibleRaw = formData.get('isGameVisible')

  let finalEnabledGames = (enabled_games || "").split(",").filter(Boolean)
  let finalVisibleGames = (visible_games || "").split(",").filter(Boolean)
  if (isGameVisibleRaw !== null && isGameVisibleRaw === 'on' && !finalVisibleGames.includes(activeGame)) {
    finalVisibleGames.push(activeGame)
  } else if (isGameVisibleRaw !== null && isGameVisibleRaw !== 'on') {
    finalVisibleGames = finalVisibleGames.filter(g => g !== activeGame)
  }

  const updateData: any = {
    id:               user.id as string,
    display_name,
    has_mic:          hasMic,
    is_paused:        isPaused,
    enabled_games:    finalEnabledGames.join(','),
    visible_games:    finalVisibleGames.join(','),
    language:         language,
    updated_at:       new Date().toISOString(),
    last_seen:        new Date().toISOString(),
    discord_id:       user.user_metadata.provider_id || user.identities?.[0]?.id || user.id,
    discord_username: (user.user_metadata.full_name || user.user_metadata.name) as string,
    avatar_url:       user.user_metadata.avatar_url,
  }

  // CS2 friend_code is stored at top-level profile
  if (activeGame === 'CS2') {
    updateData.friend_code = (formData.get('friend_code') as string)?.trim() ?? (currentProf as any)?.friend_code ?? '';
  }

  const updatedGameProfile: any = {
    ...existingGameProfile,
    bio:       bio       || existingGameProfile?.bio       || '',
    queues:    preferred_queue || existingGameProfile?.queues || '',
    rank_updated_at: null,
  };

  if (activeGame === 'CS2') {
    updatedGameProfile.rank        = formData.get('rank') as string || getRank(currentProf, activeKey) || 'Unranked';
    updatedGameProfile.role        = role || existingGameProfile?.role || '';
    updatedGameProfile.region      = formData.get('region') as string || getRegion(currentProf, activeKey) || 'EU';
  } else {
    updatedGameProfile.region    = gRegion;
    updatedGameProfile.tag_line  = tLine;
    updatedGameProfile.game_name = gName;
    updatedGameProfile.puuid     = puuid;

    if (activeGame === 'LOL') {
      updatedGameProfile.role = role;
      updatedGameProfile.rank = (apiRank && apiRank !== 'UNRANKED') ? apiRank : (formData.get('solo_rank') as string || getRank(currentProf, activeKey) || 'Unranked');
      updatedGameProfile.flex_rank = formData.get('flex_rank') as string || getExtra(currentProf, activeKey, 'flex_rank') || 'Unranked';
    } else if (activeGame === 'VALORANT') {
      updatedGameProfile.role   = role   || existingGameProfile?.role   || '';
      updatedGameProfile.rank   = formData.get('rank') as string || getRank(currentProf, activeKey) || 'Unranked';
      updatedGameProfile.agents = formData.get('agents') as string || getExtra(currentProf, activeKey, 'agents') || '';
    } else if (activeGame === 'TFT') {
      if (tftApiStats) {
        updatedGameProfile.rank            = tftApiStats.rank;
        updatedGameProfile.wins            = tftApiStats.wins;
        updatedGameProfile.losses          = tftApiStats.losses;
        updatedGameProfile.rank_updated_at = new Date().toISOString();
      } else {
        // No Riot account linked yet — preserve whatever was there.
        updatedGameProfile.rank = getRank(currentProf, activeKey) || 'Unranked';
      }
    }
  }

  const finalUpdate = buildGameUpdate(currentProf, activeKey as any, updatedGameProfile);
  updateData.game_profiles = finalUpdate.game_profiles;

  // Синхронізуємо Riot ID між LOL ↔ TFT (game_name/tag_line/region — одне і те ж
  // у Riot-акаунті), але НЕ puuid: він per-key encrypted і у LOL та TFT різний.
  // Інвалідуємо rank-кеш суміжної гри, щоб вона при наступному відкритті
  // переретайнила свій puuid через свій ключ.
  if (activeGame === 'LOL' && getGameProfile(currentProf, 'tft')) {
    const tftExisting = getGameProfile(currentProf, 'tft');
    updateData.game_profiles.tft = {
      ...tftExisting,
      game_name: gName,
      tag_line: tLine,
      region: gRegion,
      // якщо Riot ID змінився — обнуляємо tft.puuid, бо він тепер не відповідає акаунту
      puuid: (gName !== tftExisting.game_name || tLine !== tftExisting.tag_line || gRegion !== tftExisting.region) ? null : tftExisting.puuid,
      rank_updated_at: null,
    };
  } else if (activeGame === 'TFT' && getGameProfile(currentProf, 'lol')) {
    const lolExisting = getGameProfile(currentProf, 'lol');
    updateData.game_profiles.lol = {
      ...lolExisting,
      game_name: gName,
      tag_line: tLine,
      region: gRegion,
      puuid: (gName !== lolExisting.game_name || tLine !== lolExisting.tag_line || gRegion !== lolExisting.region) ? null : lolExisting.puuid,
      rank_updated_at: null,
    };
  }

  // ─── Merge other games ───────────────────────────────────────────────────
  // Always preserve the existing `other` array; overwrite only if otherGames was passed
  const previousOther: OtherGameEntry[] = currentProf?.game_profiles?.other ?? []

  console.log('[updateProfile] otherGames param:', otherGames === undefined ? 'undefined' : otherGames)
  console.log('[updateProfile] previousOther from DB:', previousOther)

  if (otherGames !== undefined) {
    updateData.game_profiles.other = otherGames

    // Figure out which entries were added / kept / removed to keep custom_games in sync
    const previousIds = new Set(previousOther.map((e) => e.game_id))
    const nextIds     = new Set(otherGames.map((e) => e.game_id))

    const addedEntries   = otherGames.filter((e) => !previousIds.has(e.game_id))
    const keptEntries    = otherGames.filter((e) => previousIds.has(e.game_id))
    const removedEntries = previousOther.filter((e) => !nextIds.has(e.game_id))

    console.log('[updateProfile] diff: added=', addedEntries.map(e => e.game_name),
      'kept=', keptEntries.map(e => e.game_name),
      'removed=', removedEntries.map(e => e.game_name))

    await upsertCustomGames(supabase, addedEntries, keptEntries, removedEntries)
  } else {
    // Not provided — keep existing
    updateData.game_profiles.other = previousOther
    console.log('[updateProfile] otherGames is undefined — keeping previous')
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updateData, { onConflict: 'id' })

  if (error) { return { error: error.message }; }

  revalidatePath(`/profile/${user.id}`, 'page')

  return { success: true, puuid }
}