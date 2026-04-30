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

// Огортаємо функції для використання як Server Actions (запобігає помилкам ре-експорту)
export async function getRanksByPuuidAction(puuid: string, region: string) {
  return await getRanksByPuuid(puuid, region);
}

export async function getRiotTFTStatsAction(puuid: string, region: string) {
  return await getRiotTFTStats(puuid, region);
}

export async function getTopChampionsAction(puuid: string, region: string) {
  return await getTopChampions(puuid, region);
}

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  // Визначаємо змінні для Riot ID залежно від гри
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

  const bio          = formData.get(`${prefix}bio`) as string
  const role         = formData.get(`${prefix}role`) as string
  const language     = formData.get('language') as string
  const preferred_queue = formData.get(`${prefix}preferred_queue`) as string
  const enabled_games = formData.get('enabled_games') as string
  const hasMic       = formData.get('hasMic') === 'on'
  const isPaused     = formData.get('isPaused') === 'on'
  const isGameEnabled = formData.get('isGameEnabled') === 'on'

  // Перевірка зміни Riot ID для скидання PUUID
  const existingGameProfile = getGameProfile(currentProf, activeKey);
  let puuid: string | null = getExtra(currentProf, activeKey, 'puuid') || null;
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

  // Примітка: перевірка унікальності puuid тепер може знадобитися через rpc або складний фільтр, 
  // якщо puuid не є окремою колонкою. Якщо пуід залишився колонкою — код нижче ок.

  let apiRank: string | null = null
  if (puuid) {
    if (activeGame === 'LOL') {
      const ranks = await getRanksByPuuid(puuid, gRegion)
      if (ranks) {
        apiRank = ranks.solo !== 'UNRANKED' ? ranks.solo : ranks.flex;
      }
    } else if (activeGame === 'TFT') {
      try {
        const tftStats = await getRiotTFTStats(puuid, gRegion)
        if (tftStats) {
          apiRank = `${(tftStats as any).tier || ''} ${tftStats.rank || ''}`.trim();
        }
      } catch {}
    }
  }

  let finalEnabledGames = (enabled_games || "").split(",").filter(Boolean)
  if (isGameEnabled && !finalEnabledGames.includes(activeGame)) {
    finalEnabledGames.push(activeGame)
  } else if (!isGameEnabled) {
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

  // Формуємо оновлений об'єкт для конкретної гри
  const updatedGameProfile: any = {
    ...existingGameProfile,
    bio: bio,
    queues: preferred_queue,
    region: gRegion,
    tag_line: tLine,
    game_name: gName,
    puuid: puuid,
  };

  if (activeGame === 'LOL') {
    updatedGameProfile.role = role;
    updatedGameProfile.rank = (apiRank && apiRank !== 'UNRANKED') ? apiRank : (formData.get('solo_rank') as string || getRank(currentProf, activeKey) || 'Unranked');
    updatedGameProfile.flex_rank = formData.get('flex_rank') as string || getExtra(currentProf, activeKey, 'flex_rank') || 'Unranked';
  } else if (activeGame === 'VALORANT') {
    updatedGameProfile.role = role;
    updatedGameProfile.rank = formData.get('val_rank') as string || getRank(currentProf, activeKey) || 'Unranked';
    updatedGameProfile.agents = (formData.get('val_top_agents') as string) || getExtra(currentProf, activeKey, 'agents') || '';
  } else if (activeGame === 'TFT') {
    updatedGameProfile.rank = (apiRank && apiRank !== 'UNRANKED') ? apiRank : (formData.get('tft_rank') as string || getRank(currentProf, activeKey) || 'Unranked');
  }

  // Оновлюємо загальний об'єкт профілів, не зачіпаючи інші ігри
  const finalUpdate = buildGameUpdate(currentProf, activeKey as any, updatedGameProfile);
  updateData.game_profiles = finalUpdate.game_profiles;

  // Якщо Riot ID спільний для LoL та TFT, оновимо дані і в іншому профілі
  if (activeGame === 'LOL' && getGameProfile(currentProf, 'tft')) {
    updateData.game_profiles.tft = { ...getGameProfile(currentProf, 'tft'), game_name: gName, tag_line: tLine, region: gRegion, puuid };
  } else if (activeGame === 'TFT' && getGameProfile(currentProf, 'lol')) {
    updateData.game_profiles.lol = { ...getGameProfile(currentProf, 'lol'), game_name: gName, tag_line: tLine, region: gRegion, puuid };
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updateData, { onConflict: 'id' })

  if (error) {return { error: error.message }; }

  if (puuid) {
    revalidateTag('ranks', 'max');
    revalidateTag('tft-stats', 'max');
    revalidateTag('top-champions', 'max');
  }

  revalidatePath(`/profile/${user.id}`, 'page')

  return { success: true, puuid }
}