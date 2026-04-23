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

  // Переконайтеся, що тут НЕМАЄ .replace(/\s/g, '')
  const gameName = (formData.get('gameName') as string)?.trim() || ''
  const tagLine = (formData.get('tagLine') as string)?.trim().replace('#', '') || ''
  const region = formData.get('region') as string
  const bio = formData.get('bio') as string
  const role = formData.get('role') as string
  const languages = formData.getAll('languages') as string[]
  const queues = formData.getAll('queues') as string[]
  const enabledGames = formData.getAll('enabledGames') as string[]
  const hasMic = formData.get('hasMic') === 'on'
  const isPaused = formData.get('isPaused') === 'on'

  // Крок 1: Пошук Акаунта (PUUID)
  const account = await getAccountByRiotId(gameName, tagLine, region)
  if (!account || (account as any).error) {
    const status = (account as any)?.status;
    if (status === 401) return { error: "Riot API Key expired or not yet activated. Please wait 2 minutes." };
    if (status === 403) return { error: "API Key forbidden. Check your Riot Dashboard." };
    return { error: `Riot ID ${gameName}#${tagLine} not found in ${region}.` };
  }

  // Перевірка, чи цей PUUID вже прив'язаний до ІНШОГО користувача
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('puuid', account.puuid)
    .neq('id', user.id) // перевіряємо всіх, крім поточного юзера
    .maybeSingle()

  if (existingProfile) {
    return { error: "This Riot account is already linked to another user's profile." };
  }

  // Крок 2: Отримання рангу за PUUID
  const ranks = await getRanksByPuuid(account.puuid, region) || { solo: 'UNRANKED', flex: 'UNRANKED' };

  // TFT Rank
  let tftRank = 'UNRANKED';
  try {
    const tftStats = await getRiotTFTStats(account.puuid, region);
    tftRank = tftStats && tftStats[0] ? `${tftStats[0].tier} ${tftStats[0].rank}` : 'UNRANKED';
  } catch (e) {
    console.error("Failed to fetch TFT stats, skipping:", e);
  }

  // Крок 3: Пошук Сумонера (нам все ще потрібен summoner_id для бази, якщо ви його зберігаєте)
  // Використовуємо V4, щоб не було 403
  const summoner = await getSummonerByPuuid(account.puuid, region)

  // Крок 4: Оновлення в Supabase
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id, // Обов'язково для upsert
      game_name: account.gameName,
      tag_line: account.tagLine,
      puuid: account.puuid,
      summoner_id: summoner?.id || null, // Це encryptedSummonerId
      region: region,
      solo_rank: ranks.solo,
      flex_rank: ranks.flex,
      tft_rank: tftRank,
      has_mic: hasMic,
      is_paused: isPaused,
      main_role: role,
      preferred_queue: queues.join(','),
      enabled_games: enabledGames.join(','), // Напр: "LOL,TFT"
      avatar_url: user.user_metadata.avatar_url,
      language: languages.join(','),
      bio: bio,
      discord_id: user.user_metadata.provider_id || user.identities?.[0]?.id || user.id, // Справжній Discord Snowflake ID
      discord_username: user.user_metadata.full_name || user.user_metadata.name,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }
  return { success: true }
}