'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const RIOT_API_KEY = process.env.RIOT_API_KEY;

const regionToPlatform = (region: string) => {
  const mapping: Record<string, string> = {
    'EUW': 'euw1',
    'EUNE': 'eun1',
    'NA': 'na1',
    'KR': 'kr'
  };
  return mapping[region] || 'euw1';
};

export async function getRiotLeagueStats(puuid: string, region: string) {
  const platform = regionToPlatform(region);
  
  // Спочатку отримуємо summonerId, бо league-v4 вимагає його, а не PUUID
  const sumRes = await fetch(
    `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${RIOT_API_KEY}`,
    { next: { revalidate: 300 } } // Кешуємо на 5 хв
  );
  if (!sumRes.ok) return null;
  const summoner = await sumRes.json();

  const leagueRes = await fetch(
    `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}?api_key=${RIOT_API_KEY}`,
    { next: { revalidate: 300 } }
  );
  if (!leagueRes.ok) return null;
  return await leagueRes.json();
}

export async function getTopChampions(puuid: string, region: string) {
  const platform = regionToPlatform(region);
  
  // Отримуємо майстерність чемпіонів
  const masteryRes = await fetch(
    `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=10&api_key=${RIOT_API_KEY}`,
    { next: { revalidate: 300 } }
  );
  if (!masteryRes.ok) return [];
  const masteries = await masteryRes.json();

  // Отримуємо дані про імена чемпіонів з DataDragon
  const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json', { next: { revalidate: 86400 } }); // DataDragon кешуємо на добу
  const versions = await versionRes.json();
  const latest = versions[0];

  const champDataRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`, { next: { revalidate: 86400 } });
  const { data: champs } = await champDataRes.json();

  // Мапимо ID на імена та іконки
  return masteries.map((m: any) => {
    const champ = Object.values(champs).find((c: any) => parseInt(c.key) === m.championId) as any;
    return {
      name: champ?.name || 'Unknown',
      id: m.championId,
      level: m.championLevel,
      points: m.championPoints,
      icon: `https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${champ?.image?.full}`
    };
  });
}

export async function sendMatchRequest(targetId: string) {
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
  if (!user) return { error: 'You must be logged in' }
  if (user.id === targetId) return { error: 'You cannot match with yourself' }

  // Перевіряємо чи вже є запит
  const { data: existing } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', user.id)
    .eq('target_id', targetId)
    .single()

  if (existing) return { error: 'Request already sent' }

  const { error } = await supabase
    .from('matches')
    .insert({ user_id: user.id, target_id: targetId, status: 'PENDING' })

  if (error) return { error: error.message }

  return { success: true }
}

export async function getMatches() {
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
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      user_id,
      target_id,
      status,
      sender:profiles!user_id (id, game_name, tag_line, avatar_url, main_role, solo_rank, flex_rank, preferred_queue),
      receiver:profiles!target_id (id, game_name, tag_line, avatar_url, main_role, solo_rank, flex_rank, preferred_queue)
    `)
    .or(`user_id.eq.${user.id},target_id.eq.${user.id}`)

  if (error) return { error: error.message }

  const result = data.map((m: any) => {
    const isSender = m.user_id === user.id
    return {
      id: m.id,
      status: m.status,
      isIncoming: !isSender,
      profile: isSender ? m.receiver : m.sender
    }
  })

  return { data: result }
}

export async function updateMatchStatus(matchId: string, status: 'ACCEPTED' | 'DECLINED') {
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

  const { error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', matchId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function upsertReview(targetId: string, comment: string, behaviorRating: number, skillRating: number) {
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
  if (!user) return { error: 'Unauthorized' }

  // Перевіряємо наявність ACCEPTED метчу
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .or(`and(user_id.eq.${user.id},target_id.eq.${targetId}),and(user_id.eq.${targetId},target_id.eq.${user.id})`)
    .eq('status', 'ACCEPTED')
    .single()

  if (!match) return { error: 'You can only review players you are matched with' }

  const { error } = await supabase
    .from('reviews')
    .upsert({
      reviewer_id: user.id,
      target_id: targetId,
      comment,
      behavior_rating: behaviorRating,
      skill_rating: skillRating,
      updated_at: new Date().toISOString()
    }, { onConflict: 'reviewer_id,target_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getReviewsForUser(targetId: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => '' } as any } // Тільки для читання
  )

  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(game_name, avatar_url)')
    .eq('target_id', targetId)

  return { data, error }
}

export async function sendMessage(matchId: string, content: string) {
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
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: user.id,
      content: content.trim()
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getMessages(matchId: string) {
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

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  return { data, error }
}

export async function markMessagesAsRead(matchId: string) {
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
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('match_id', matchId)
    .neq('sender_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}