'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAccountByRiotId, getSummonerByPuuid, getRanksByPuuid } from '@/src/lib/riot'
import { getRiotTFTStats } from '@/app/matches/actions'

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

  const activeGame = formData.get('activeGame') as string
  const gameName = (formData.get(`${activeGame.toLowerCase()}_gameName`) as string)?.trim() || ''
  const tagLine = (formData.get(`${activeGame.toLowerCase()}_tagLine`) as string)?.trim().replace('#', '') || ''
  const region = formData.get(`${activeGame.toLowerCase()}_region`) as string
  
  const bio = formData.get('bio') as string
  const role = formData.get('role') as string
  const languages = formData.getAll('languages') as string[]
  const queues = formData.getAll('queues') as string[]
  const enabledGames = formData.getAll('enabledGames') as string[]
  const hasMic = formData.get('hasMic') === 'on'
  const isPaused = formData.get('isPaused') === 'on'
  const isGameEnabled = formData.get('isGameEnabled') === 'on'

  // Крок 1: Пошук Акаунта (PUUID)
  const account = await getAccountByRiotId(gameName, tagLine, region)
  if (!account || (account as any).error) {
    const status = (account as any)?.status;
    if (status === 401) return { error: "Riot API Key expired or not yet activated. Please wait 2 minutes." };
    if (status === 403) return { error: "API Key forbidden. Check your Riot Dashboard." };
    return { error: `Riot ID ${gameName}#${tagLine} not found in ${region}.` };
  }

  // Перевірка унікальності PUUID для конкретної гри
  const puuidColumn = activeGame === 'LOL' ? 'puuid' : (activeGame === 'VALORANT' ? 'val' : activeGame.toLowerCase()) + '_puuid';
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq(puuidColumn, account.puuid)
    .neq('id', user.id)
    .maybeSingle()

  if (existingProfile) {
    return { error: "This Riot account is already linked to another user's profile." };
  }

  // Крок 2: Отримання статсів залежно від гри
  let stats: any = {};
  if (activeGame === 'LOL') {
    const ranks = (await getRanksByPuuid(account.puuid, region) || {}) as any;
    stats = { 
      solo_rank: ranks.solo || 'UNRANKED', 
      flex_rank: ranks.flex || 'UNRANKED',
      solo_wins: ranks.solo_wins || 0,
      solo_losses: ranks.solo_losses || 0,
      flex_wins: ranks.flex_wins || 0,
      flex_losses: ranks.flex_losses || 0
    };
  } else if (activeGame === 'TFT') {
    try {
      const tftStats = await getRiotTFTStats(account.puuid, region);
      stats.tft_rank = tftStats && tftStats[0] ? `${tftStats[0].tier} ${tftStats[0].rank}` : 'UNRANKED';
      stats.tft_wins = tftStats && tftStats[0] ? tftStats[0].wins : 0;
      stats.tft_losses = tftStats && tftStats[0] ? tftStats[0].losses : 0;
    } catch (e) {
      console.error("Failed to fetch TFT stats:", e);
    }
  } else if (activeGame === 'VALORANT') {
    // Placeholder для Valorant Rank (потрібен VAL-RANKED-V1)
    stats.val_rank = 'UNRANKED';
  }

  // Формуємо список увімкнених ігор
  let finalEnabledGames = [...enabledGames];
  if (isGameEnabled && !finalEnabledGames.includes(activeGame)) {
    finalEnabledGames.push(activeGame);
  } else if (!isGameEnabled) {
    finalEnabledGames = finalEnabledGames.filter(g => g !== activeGame);
  }

  // Крок 4: Оновлення в Supabase
  const updateData: any = {
    id: user.id,
    has_mic: hasMic,
    is_paused: isPaused,
    enabled_games: finalEnabledGames.join(','),
    language: languages.join(','),
    updated_at: new Date().toISOString(),
    discord_id: user.user_metadata.provider_id || user.identities?.[0]?.id || user.id,
    discord_username: user.user_metadata.full_name || user.user_metadata.name,
    avatar_url: user.user_metadata.avatar_url,
  };

  // Динамічно додаємо поля для конкретної гри
  const prefix = activeGame === 'LOL' ? '' : (activeGame === 'VALORANT' ? 'val' : activeGame.toLowerCase()) + '_';
  updateData[`${prefix}game_name`] = account.gameName;
  updateData[`${prefix}tag_line`] = account.tagLine;
  updateData[`${prefix}puuid`] = account.puuid;
  updateData[`${prefix}region`] = region;
  updateData[`${prefix}bio`] = bio;
  updateData[`${prefix}main_role`] = role;
  updateData[`${prefix}preferred_queue`] = queues.join(',');

  if (activeGame === 'LOL') {
    updateData.solo_rank = stats.solo_rank;
    updateData.flex_rank = stats.flex_rank;
    updateData.solo_wins = stats.solo_wins;
    updateData.solo_losses = stats.solo_losses;
    updateData.flex_wins = stats.flex_wins;
    updateData.flex_losses = stats.flex_losses;
  } else if (activeGame === 'TFT') {
    updateData.tft_rank = stats.tft_rank;
    updateData.tft_wins = stats.tft_wins;
    updateData.tft_losses = stats.tft_losses;
  } else if (activeGame === 'VALORANT') {
    updateData.val_rank = stats.val_rank;
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updateData, { onConflict: 'id' })

  if (error) return { error: error.message }
  return { success: true }
}