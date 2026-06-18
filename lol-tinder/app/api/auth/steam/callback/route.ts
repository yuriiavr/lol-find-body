import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getBaseUrl } from '@/src/lib/baseUrl'

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login'
const STEAM_ID_PREFIX = 'https://steamcommunity.com/openid/id/'

async function verifySteamOpenID(params: URLSearchParams): Promise<string | null> {
  // Перевіряємо, що відповідь дійсно від Steam, ще ДО мережевого виклику.
  const opEndpoint = params.get('openid.op_endpoint') ?? ''
  const claimedId = params.get('openid.claimed_id') ?? ''
  const identity = params.get('openid.identity') ?? ''
  if (opEndpoint !== STEAM_OPENID_ENDPOINT) return null
  if (!claimedId.startsWith(STEAM_ID_PREFIX)) return null
  if (!identity.startsWith(STEAM_ID_PREFIX)) return null

  const verifyParams = new URLSearchParams(params)
  verifyParams.set('openid.mode', 'check_authentication')

  const res = await fetch(STEAM_OPENID_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  })

  const text = await res.text()
  // Розбираємо порядково, а не loose-substring: рядок має точно дорівнювати "is_valid:true".
  const valid = text
    .split('\n')
    .map((l) => l.trim())
    .some((l) => l === 'is_valid:true')
  if (!valid) return null

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
  const appUrl = getBaseUrl()
  const params = req.nextUrl.searchParams

  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value === 'uk' ? 'uk' : 'en'
  const profilePath = `${appUrl}/${locale}/profile`

  // ─── CSRF state: query-параметр має збігатися з cookie ──────────────────
  const stateFromQuery = params.get('state')
  const stateFromCookie = cookieStore.get('steam_oauth_state')?.value
  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    return NextResponse.redirect(`${profilePath}?steam_error=state_mismatch`)
  }

  const steamId = await verifySteamOpenID(params)
  if (!steamId) {
    return NextResponse.redirect(`${profilePath}?steam_error=verification_failed`)
  }

  const steamUsername = await getSteamUsername(steamId)
  const friendCode = (BigInt(steamId) - BigInt('76561197960265728')).toString()

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
    return NextResponse.redirect(`${profilePath}?steam_error=not_authenticated`)
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
    return NextResponse.redirect(`${profilePath}?steam_error=db_error`)
  }

  const res = NextResponse.redirect(`${profilePath}?steam_connected=1`)
  res.cookies.delete('steam_oauth_state')
  return res
}
