import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { steamIdToFriendCode } from '@/src/lib/steamFriendCode'

async function verifySteamOpenID(params: URLSearchParams): Promise<string | null> {
  const verifyParams = new URLSearchParams(params)
  verifyParams.set('openid.mode', 'check_authentication')

  const res = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  })

  const text = await res.text()
  if (!text.includes('is_valid:true')) return null

  const claimedId = params.get('openid.claimed_id') ?? ''
  const match = claimedId.match(/\/openid\/id\/(\d+)$/)
  return match ? match[1] : null
}

async function getSteamUsername(steamId: string): Promise<string | null> {
  const apiKey = process.env.STEAM_API_KEY
  if (!apiKey) return null

  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
  )
  if (!res.ok) return null

  const data = await res.json()
  return data?.response?.players?.[0]?.personaname ?? null
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const params = req.nextUrl.searchParams

  const steamId = await verifySteamOpenID(params)
  if (!steamId) {
    return NextResponse.redirect(`${appUrl}/profile?steam_error=verification_failed`)
  }

  const steamUsername = await getSteamUsername(steamId)
  const friendCode = steamIdToFriendCode(steamId)

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
  if (!user) {
    return NextResponse.redirect(`${appUrl}/profile?steam_error=not_authenticated`)
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      steam_id:       steamId,
      steam_username: steamUsername,
      friend_code:    friendCode,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.redirect(`${appUrl}/profile?steam_error=db_error`)
  }

  return NextResponse.redirect(`${appUrl}/profile?steam_connected=1`)
}