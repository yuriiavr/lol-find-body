'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

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