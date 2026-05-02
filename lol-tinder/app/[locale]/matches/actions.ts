'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { moderateComment } from '@/src/lib/moderation'

// ─── Helper ───────────────────────────────────────────────────────────────────
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

export async function sendMatchRequest(targetId: string) {
  const supabase = await createCookieClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in' }
  if (user.id === targetId) return { error: 'You cannot match with yourself' }

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
  const supabase = await createCookieClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      user_id,
      target_id,
      status,
      sender:profiles!user_id (id, display_name, avatar_url, last_seen, language, enabled_games, game_profiles),
      receiver:profiles!target_id (id, display_name, avatar_url, last_seen, language, enabled_games, game_profiles),
      messages (content, sender_id, created_at)
    `)
    .or(`user_id.eq.${user.id},target_id.eq.${user.id}`)
    .order('created_at', { foreignTable: 'messages', ascending: false })
    .limit(1, { foreignTable: 'messages' })

  if (error) return { error: error.message }

  const result = data.map((m: any) => {
    const isSender = m.user_id === user.id
    return {
      id: m.id,
      status: m.status,
      isIncoming: !isSender,
      profile: isSender ? m.receiver : m.sender,
      last_message: m.messages?.[0]
    }
  })

  return { data: result }
}

export async function updateMatchStatus(matchId: string, status: 'ACCEPTED' | 'DECLINED') {
  const supabase = await createCookieClient()

  const { error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', matchId)

  if (error) return { error: error.message }
  return { success: true }
}

// ─── upsertReview — з AI-модерацією ──────────────────────────────────────────
export async function upsertReview(
  targetId: string,
  comment: string,
  behaviorRating?: number, // залишаємо для сумісності, але не використовуємо
  skillRating?: number,
  gameType: 'LOL' | 'TFT' | 'VALORANT' = 'LOL'
) {
  const supabase = await createCookieClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .or(`and(user_id.eq.${user.id},target_id.eq.${targetId}),and(user_id.eq.${targetId},target_id.eq.${user.id})`)
    .eq('status', 'ACCEPTED')
    .single()

  if (!match) return { error: 'You can only review players you are matched with' }

  // ── Модерація через Gemini ──
  const modStatus = await moderateComment(comment)

  if (modStatus === 'rejected') {
    return {
      error: null,
      success: false,
      moderation: 'rejected' as const,
    }
  }

  const { error } = await supabase
    .from('reviews')
    .upsert({
      reviewer_id: user.id,
      target_id: targetId,
      comment,
      game_type: gameType,
      moderation_status: modStatus, // 'approved' або 'pending'
      updated_at: new Date().toISOString()
    }, { onConflict: 'reviewer_id,target_id,game_type' })

  if (error) return { error: error.message }

  return {
    success: true,
    moderation: modStatus, // 'approved' | 'pending'
  }
}

// ─── getReviewsForUser — тільки approved ─────────────────────────────────────
export async function getReviewsForUser(targetId: string, gameType?: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => '' } as any }
  )

  const query = supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(display_name, avatar_url)')
    .eq('target_id', targetId)
    .eq('moderation_status', 'approved') // ← тільки схвалені коментарі видимі іншим
    .order('updated_at', { ascending: false })

  const { data, error } = await query

  return { data, error }
}

// ─── getMyReviewForUser — для автора (показує його власний pending/approved) ─
export async function getMyReviewForUser(targetId: string, gameType: string = 'LOL') {
  const supabase = await createCookieClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null }

  const { data, error } = await supabase
    .from('reviews')
    .select('comment, moderation_status')
    .eq('reviewer_id', user.id)
    .eq('target_id', targetId)
    .eq('game_type', gameType)
    .maybeSingle()

  return { data, error }
}

export async function sendMessage(matchId: string, content: string) {
  const supabase = await createCookieClient()

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
  const supabase = await createCookieClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  return { data, error }
}

export async function markMessagesAsRead(matchId: string) {
  const supabase = await createCookieClient()

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