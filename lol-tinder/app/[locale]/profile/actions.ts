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
  const display_name = (formData.get('display_name') as string)?.trim() || (currentProf as any)?.display_name || ''
  const prefix = activeGame === 'LOL' ? '' : (activeGame === 'VALORANT' ? 'val_' : 'tft_');

  // Global Riot Account fields (Shared between LOL and TFT)
  const riot_game_name = (formData.get('riot_game_name') as string)?.trim() || (currentProf as any)?.riot_game_name || '';
  const riot_tag_line  = (formData.get('riot_tag_line') as string)?.trim().replace('#', '') || (currentProf as any)?.riot_tag_line || '';
  const riot_region    = (formData.get('riot_region') as string) || (currentProf as any)?.riot_region || 'EUW';

  const val_game_name = (formData.get('val_game_name') as string)?.trim() || (currentProf as any)?.val_game_name || '';
  const val_tag_line  = (formData.get('val_tag_line') as string)?.trim().replace('#', '') || (currentProf as any)?.val_tag_line || '';
  const val_region    = (formData.get('val_region') as string) || (currentProf as any)?.val_region || 'EUW';

  const bio          = formData.get(`${prefix}bio`) as string
  const role         = formData.get(`${prefix}main_role`) as string
  const manualRank   = formData.get(`${prefix}rank`) as string
  const language     = formData.get('language') as string
  const preferred_queue = formData.get(`${prefix}preferred_queue`) as string
  const enabled_games = formData.get('enabled_games') as string
  const hasMic       = formData.get('hasMic') === 'on'
  const isPaused     = formData.get('isPaused') === 'on'
  const isGameEnabled = formData.get('isGameEnabled') === 'on'

  let puuid: string | null = currentProf?.puuid || null;
  const hasRiotChanged = (riot_game_name !== currentProf?.riot_game_name) || (riot_tag_line !== currentProf?.riot_tag_line) || (riot_region !== currentProf?.riot_region);

  // If Riot ID info changed, reset PUUID to trigger re-fetch
  if (hasRiotChanged) {
    puuid = null;
  }

  if (riot_game_name && riot_tag_line && !puuid) {
    const account = await getAccountByRiotId(riot_game_name, riot_tag_line, riot_region);
    if (account) {
      puuid = account.puuid;
    } else if (activeGame === 'LOL' || activeGame === 'TFT') {
      return { error: `Riot Account not found: ${riot_game_name}#${riot_tag_line} in ${riot_region}` };
    }
  }

  if (puuid) {
    const { data: existing } = await supabase.from('profiles').select('id').eq('puuid', puuid).neq('id', user.id).maybeSingle();
    if (existing) return { error: "This Riot account is already linked to another user." };
  }

  let apiRank: string | null = null
  if (puuid) {
    if (activeGame === 'LOL') {
      const ranks = await getRanksByPuuid(puuid, riot_region)
      if (ranks) {
        // Зберігаємо тільки ранг для фільтрації в Discovery
        apiRank = ranks.solo !== 'UNRANKED' ? ranks.solo : ranks.flex;
      }
    } else if (activeGame === 'TFT') {
      try {
        const tftStats = await getRiotTFTStats(puuid, riot_region)
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
    last_seen:        new Date().toISOString(), // Додано оновлення last_seen
    discord_id:       user.user_metadata.provider_id || user.identities?.[0]?.id || user.id,
    discord_username: (user.user_metadata.full_name || user.user_metadata.name) as string,
    avatar_url:       user.user_metadata.avatar_url,
    riot_game_name:   riot_game_name,
    riot_tag_line:    riot_tag_line,
    riot_region:      riot_region,
    puuid:            puuid,
    val_game_name:    val_game_name,
    val_tag_line:     val_tag_line,
    val_region:       val_region,
  }

  // Призначаємо поля відповідно до існуючих колонок у вашій БД
  if (activeGame === 'LOL') {
    updateData.bio = bio;
    updateData.main_role = role;
    updateData.preferred_queue = preferred_queue;
  } else if (activeGame === 'VALORANT') {
    updateData.val_bio = bio;
    updateData.val_main_role = role;
    updateData.val_preferred_queue = preferred_queue;
    updateData.val_top_agents = (formData.get('val_top_agents') as string) || '';
  } else if (activeGame === 'TFT') {
    updateData.tft_bio = bio;
    updateData.tft_preferred_queue = preferred_queue;
    updateData.main_role = role; 
  }

  if (activeGame === 'LOL') {
    updateData.solo_rank = (apiRank && apiRank !== 'UNRANKED') ? apiRank : (formData.get('solo_rank') as string || currentProf?.solo_rank || 'Unranked');
    updateData.flex_rank = formData.get('flex_rank') as string || currentProf?.flex_rank || 'Unranked';
  } else if (activeGame === 'TFT') {
    updateData.tft_rank = (apiRank && apiRank !== 'UNRANKED') ? apiRank : (formData.get('tft_rank') as string || currentProf?.tft_rank || 'Unranked');
  } else if (activeGame === 'VALORANT') {
    updateData.val_rank = manualRank || currentProf?.val_rank || 'Unranked';
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