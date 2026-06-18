import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/src/lib/baseUrl'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const origin = getBaseUrl()

  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value === 'uk' ? 'uk' : 'en'
  const profilePath = `/${locale}/profile`

  if (!code) {
    return NextResponse.redirect(new URL(`${profilePath}?error=no_code`, origin))
  }

  // ─── CSRF state ─────────────────────────────────────────────────────────
  const stateFromQuery = searchParams.get('state')
  const stateFromCookie = cookieStore.get('riot_oauth_state')?.value
  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    return NextResponse.redirect(new URL(`${profilePath}?error=state_mismatch`, origin))
  }

  try {
    const tokenResponse = await fetch('https://auth.riotgames.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.RIOT_CLIENT_ID}:${process.env.RIOT_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.RIOT_REDIRECT_URI!,
      }),
    })

    const tokens = await tokenResponse.json()
    if (!tokens.access_token) throw new Error('token_exchange_failed')

    const userinfoResponse = await fetch('https://auth.riotgames.com/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    })
    const userinfo = await userinfoResponse.json()
    const puuid = userinfo.sub

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
    if (!user) throw new Error('no_session')

    const { error } = await supabase
      .from('profiles')
      .update({ puuid: puuid })
      .eq('id', user.id)

    if (error) throw new Error('db_error')

    const res = NextResponse.redirect(new URL(`${profilePath}?success=riot_connected`, origin))
    res.cookies.delete('riot_oauth_state')
    return res
  } catch (err: any) {
    // Не світимо внутрішні повідомлення про помилки в URL — лише стабільний код.
    const code = typeof err?.message === 'string' && /^[a-z_]+$/.test(err.message) ? err.message : 'riot_failed'
    return NextResponse.redirect(new URL(`${profilePath}?error=${code}`, origin))
  }
}
