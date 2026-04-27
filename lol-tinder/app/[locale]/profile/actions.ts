'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { 
  getAccountByRiotId,
  getRanksByPuuid,
  getRiotTFTStats,
  getRiotValorantStats,
  getTopChampions,
} from '@/src/lib/riot'

export { getRanksByPuuid, getRiotTFTStats, getRiotValorantStats, getTopChampions };

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
    .select('puuid, val_puuid, tft_puuid, val_region, region')
    .eq('id', user.id)
    .maybeSingle()

  const activeGame   = formData.get('activeGame') as string
  const prefix = activeGame === 'LOL' ? '' : (activeGame === 'VALORANT' ? 'val_' : 'tft_');

  const display_name = (formData.get('display_name') as string)?.trim() || ''
  const region       = formData.get(`${prefix}region`) as string

  const puuidColumn =
    activeGame === 'LOL'
      ? 'puuid'
      : (activeGame === 'VALORANT' ? 'val_' : 'tft_') + 'puuid'

  const bio          = formData.get(`${prefix}bio`) as string
  const role         = formData.get(`${prefix}main_role`) as string
  const manualRank   = formData.get(`${prefix}rank`) as string
  const language     = formData.get('language') as string
  const preferred_queue = formData.get(`${prefix}preferred_queue`) as string
  const enabled_games = formData.get('enabled_games') as string
  const hasMic       = formData.get('hasMic') === 'on'
  const isPaused     = formData.get('isPaused') === 'on'
  const isGameEnabled = formData.get('isGameEnabled') === 'on'

  if (!display_name) {
    return { error: "Global Display Name is required." }
  }

  let puuid: string | null = (currentProf as any)?.[puuidColumn] || null
  let account: any = null

  if (!puuid) {
    const gameName = (formData.get(`${prefix}game_name`) as string)?.trim() || ''
    const tagLine  = (formData.get(`${prefix}tag_line`) as string)?.trim().replace('#', '') || ''
    account = await getAccountByRiotId(gameName, tagLine, region)

    if (account && !(account as any).error) {
      puuid = account.puuid
    }
  }

  if (puuid) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq(puuidColumn, puuid)
      .neq('id', user.id)
      .maybeSingle()

    if (existingProfile) {
      return { error: "This Riot account is already linked to another user's profile." }
    }
  }

  let stats: any = {}
  if (puuid) {
    if (activeGame === 'LOL') {
      const ranks = (await getRanksByPuuid(puuid, region) || {}) as any
      stats = {
        solo_rank: ranks.solo || 'UNRANKED',
        flex_rank: ranks.flex || 'UNRANKED',
      }
    } else if (activeGame === 'TFT') {
      try {
        const tftStats = await getRiotTFTStats(puuid, region)
        stats.tft_rank = tftStats
          ? `${(tftStats as any).tier || ''} ${tftStats.rank || ''}`.trim() || 'UNRANKED'
          : 'UNRANKED'
      } catch {
        stats.tft_rank = 'UNRANKED'
      }
    } else if (activeGame === 'VALORANT') {
      try {
        const valData = await getRiotValorantStats(puuid, region)
        stats.val_rank = valData?.rankName || 'UNRANKED'
      } catch {
        stats.val_rank = 'UNRANKED'
      }
    }
  }

  // Логування для відладки (можна прибрати після перевірки)
  console.log("Processing update for:", activeGame);
  console.log("Prefix:", prefix);
  console.log("FormData Rank:", manualRank);
  console.log("FormData Role:", role);

  let finalEnabledGames = (enabled_games || "").split(",").filter(Boolean)
  if (isGameEnabled && !finalEnabledGames.includes(activeGame)) {
    finalEnabledGames.push(activeGame)
  } else if (!isGameEnabled) {
    finalEnabledGames = finalEnabledGames.filter(g => g !== activeGame)
  }

  const updateData: any = {
    id:               user.id,
    display_name,
    has_mic:          hasMic,
    is_paused:        isPaused,
    enabled_games:    finalEnabledGames.join(','),
    language:         language,
    updated_at:       new Date().toISOString(),
    discord_id:       user.user_metadata.provider_id || user.identities?.[0]?.id || user.id,
    discord_username: user.user_metadata.full_name || user.user_metadata.name,
    avatar_url:       user.user_metadata.avatar_url,
    [`${prefix}game_name`]:       account?.gameName  || (formData.get(`${prefix}game_name`) as string)?.trim(),
    [`${prefix}tag_line`]:        account?.tagLine   || (formData.get(`${prefix}tag_line`)  as string)?.trim().replace('#', ''),
    [`${prefix}region`]:          region,
    [`${prefix}bio`]:             bio,
    [`${prefix}main_role`]:       role,
    [`${prefix}preferred_queue`]: preferred_queue,
  }

  if (activeGame === 'VALORANT') {
    updateData.val_top_agents = formData.get('val_top_agents');
  }
  
  if (activeGame === 'LOL') {
    updateData.solo_rank = (stats.solo_rank && stats.solo_rank.toUpperCase() !== 'UNRANKED') ? stats.solo_rank : (formData.get('solo_rank') as string || 'Unranked');
    updateData.flex_rank = (stats.flex_rank && stats.flex_rank.toUpperCase() !== 'UNRANKED') ? stats.flex_rank : (formData.get('flex_rank') as string || 'Unranked');
  } else if (activeGame === 'TFT') {
    updateData.tft_rank = (stats.tft_rank && stats.tft_rank.toUpperCase() !== 'UNRANKED') ? stats.tft_rank : (formData.get('tft_rank') as string || 'Unranked');
  } else if (activeGame === 'VALORANT') {
    updateData.val_rank = (stats.val_rank && stats.val_rank.toUpperCase() !== 'UNRANKED') ? stats.val_rank : (manualRank || 'Unranked');
  }

  if (puuid) {
    updateData[`${prefix}puuid`] = puuid
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updateData, { onConflict: 'id' })

  if (error) return { error: error.message }

  if (puuid) {
    const tags = ['ranks', 'tft-stats', 'valorant-stats', 'top-champions'];
    tags.forEach((tag) => revalidateTag(tag, 'max'))
  }

  revalidatePath(`/profile/${user.id}`, 'page')

  return { success: true }
}