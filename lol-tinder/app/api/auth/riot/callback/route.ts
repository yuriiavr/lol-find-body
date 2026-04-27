import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(new URL('/profile?error=no_code', origin))
  }

  try {
    const tokenResponse = await fetch('<https://auth.riotgames.com/token>', {
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
    if (!tokens.access_token) throw new Error('Failed to exchange code for Riot token')

    const userinfoResponse = await fetch('<https://auth.riotgames.com/userinfo>', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    })
    const userinfo = await userinfoResponse.json()
    const puuid = userinfo.sub

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
    if (!user) throw new Error('No active session found')

    const { error } = await supabase
      .from('profiles')
      .update({ puuid: puuid })
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.redirect(new URL('/profile?success=riot_connected', origin))
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(err.message)}`, origin))
  }
}
