'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { 
  getAccountByRiotId,
  getRanksByPuuid,
  getRiotTFTStats,
  getTopChampions,
} from '@/src/lib/riot'
import { getGameProfile, buildGameUpdate, getGameName, getTagLine, getRegion, getExtra, getRank } from '@/src/lib/profile'
import { refreshRankIfNeeded } from '@/src/lib/rankCache'

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
// Тепер не йде напряму до Riot — спочатку перевіряє кеш в БД (1 година)
export async function getRanksByPuuidAction(puuid: string, region: string) {
  // Шукаємо userId по puuid в БД
  const supabase = await createCookieClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .filter('game_profiles->lol->>puuid', 'eq', puuid)
    .maybeSingle()

  // Якщо знайшли профіль → використовуємо кеш
  if (profiles?.id) {
    const result = await refreshRankIfNeeded(supabase, profiles.id, 'lol')
    if (result) return result.data
  }

  // Fallback: якщо профіль не знайдено → пряме звернення до Riot (без кешу)
  return await getRanksByPuuid(puuid, region)
}

// ─── getRiotTFTStatsAction ────────────────────────────────────────────────────
export async function getRiotTFTStatsAction(puuid: string, region: string) {
  const supabase = await createCookieClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .filter('game_profiles->tft->>puuid', 'eq', puuid)
    .maybeSingle()

  if (profiles?.id) {
    const result = await refreshRankIfNeeded(supabase, profiles.id, 'tft')
    if (result) return result.data
  }

  return await getRiotTFTStats(puuid, region)
}

// ─── getTopChampionsAction ────────────────────────────────────────────────────
// Чемпіони не ранги — кеш тут не потрібен, залишаємо як є
export async function getTopChampionsAction(puuid: string, region: string) {
  return await getTopChampions(puuid, region);
}

// ─── updateProfile ────────────────────────────────────────────────────────────
export async function updateProfile(formData: FormData) {
  const supabase = await createCookieClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: currentProf } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const activeGame   = formData.get('activeGame') as string
  const activeKey    = activeGame.toLowerCase() as 'lol' | 'tft' | 'valorant'
  
  const display_name = (formData.get('display_name') as string)?.trim() || (currentProf as any)?.display_name || ''
  const prefix = activeGame === 'LOL' ? '' : (activeGame === 'VALORANT' ? 'val_' : 'tft_');

  let gName = '', tLine = '', gRegion = 'EUW';

  if (activeGame === 'LOL' || activeGame === 'TFT') {
    const lolGameName = getGameName(currentProf, 'lol');
    const tftGameName = getGameName(currentProf, 'tft');
    gName   = (formData.get('riot_game_name') as string)?.trim() || lolGameName || tftGameName || '';
    tLine   = (formData.get('riot_tag_line') as string)?.trim().replace('#', '') || getTagLine(currentProf, 'lol') || getTagLine(currentProf, 'tft') || '';
    gRegion = (formData.get('riot_region') as string) || getRegion(currentProf, 'lol') || getRegion(currentProf, 'tft') || 'EUW';
  } else {
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
  const hasMicRaw     = formData.get('has_mic') ?? formData.get('hasMic')
  const hasMic        = hasMicRaw !== null ? (hasMicRaw === 'true' || hasMicRaw === 'on') : ((currentProf as any)?.has_mic ?? true)
  const isPaused     = formData.get('isPaused') === 'on'
  const isGameEnabledRaw = formData.get('isGameEnabled')

  const existingGameProfile = getGameProfile(currentProf, activeKey);

  let puuid: string | null = null;
  let apiRank: string | null = null;

  if (activeGame !== 'VALORANT') {
    puuid = getExtra(currentProf, activeKey, 'puuid') || null;
    const hasRiotChanged = (gName !== getGameName(currentProf, activeKey)) || (tLine !== getTagLine(currentProf, activeKey)) || (gRegion !== getRegion(currentProf, activeKey));

    if (hasRiotChanged) {
      puuid = null;
    }

    if (gName && tLine && !puuid) {
      const account = await getAccountByRiotId(gName, tLine, gRegion);
      if (account) {
        puuid = account.puuid;
      } else {
        return { error: `Account not found: ${gName}#${tLine} in ${gRegion}` };
      }
    }

    if (puuid && activeGame === 'LOL') {
      // При збереженні профілю — завжди оновлюємо ранг (скидаємо rank_updated_at)
      // щоб наступний виклик getRanksByPuuidAction підтягнув свіжі дані
      const ranks = await getRanksByPuuid(puuid, gRegion)
      if (ranks) {
        apiRank = ranks.solo !== 'UNRANKED' ? ranks.solo : ranks.flex;
      }
    }
  }

  let finalEnabledGames = (enabled_games || "").split(",").filter(Boolean)
  if (isGameEnabledRaw !== null && isGameEnabledRaw === 'on' && !finalEnabledGames.includes(activeGame)) {
    finalEnabledGames.push(activeGame)
  } else if (isGameEnabledRaw !== null && isGameEnabledRaw !== 'on') {
    finalEnabledGames = finalEnabledGames.filter(g => g !== activeGame)
  }

  const updateData: any = {
    id:               user.id as string,
    display_name,
    has_mic:          hasMic,
    is_paused:        isPaused,
    enabled_games:    finalEnabledGames.join(','),
    language:         language,
    updated_at:       new Date().toISOString(),
    last_seen:        new Date().toISOString(),
    discord_id:       user.user_metadata.provider_id || user.identities?.[0]?.id || user.id,
    discord_username: (user.user_metadata.full_name || user.user_metadata.name) as string,
    avatar_url:       user.user_metadata.avatar_url,
  }

  const updatedGameProfile: any = {
    ...existingGameProfile,
    bio:       bio       || existingGameProfile?.bio       || '',
    queues:    preferred_queue || existingGameProfile?.queues || '',
    region:    gRegion,
    tag_line:  tLine,
    game_name: gName,
    puuid:     puuid,
    // Скидаємо кеш при збереженні профілю → наступний перегляд підтягне свіжий ранг
    rank_updated_at: null,
  };

  if (activeGame === 'LOL') {
    updatedGameProfile.role = role;
    updatedGameProfile.rank = (apiRank && apiRank !== 'UNRANKED') ? apiRank : (formData.get('solo_rank') as string || getRank(currentProf, activeKey) || 'Unranked');
    updatedGameProfile.flex_rank = formData.get('flex_rank') as string || getExtra(currentProf, activeKey, 'flex_rank') || 'Unranked';
  } else if (activeGame === 'VALORANT') {
    updatedGameProfile.role   = role   || existingGameProfile?.role   || '';
    updatedGameProfile.rank   = formData.get('rank') as string || getRank(currentProf, activeKey) || 'Unranked';
    updatedGameProfile.agents = formData.get('agents') as string || getExtra(currentProf, activeKey, 'agents') || '';
  } else if (activeGame === 'TFT') {
    updatedGameProfile.rank = formData.get('rank') as string || getRank(currentProf, activeKey) || 'Unranked';
  }

  const finalUpdate = buildGameUpdate(currentProf, activeKey as any, updatedGameProfile);
  updateData.game_profiles = finalUpdate.game_profiles;

  if (activeGame === 'LOL' && getGameProfile(currentProf, 'tft')) {
    updateData.game_profiles.tft = { ...getGameProfile(currentProf, 'tft'), game_name: gName, tag_line: tLine, region: gRegion, puuid, rank_updated_at: null };
  } else if (activeGame === 'TFT' && getGameProfile(currentProf, 'lol')) {
    updateData.game_profiles.lol = { ...getGameProfile(currentProf, 'lol'), game_name: gName, tag_line: tLine, region: gRegion, puuid, rank_updated_at: null };
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updateData, { onConflict: 'id' })

  if (error) { return { error: error.message }; }

  revalidatePath(`/profile/${user.id}`, 'page')

  return { success: true, puuid }
}