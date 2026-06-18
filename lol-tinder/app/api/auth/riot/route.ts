import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/src/lib/baseUrl'

// Ініціація Riot RSO OAuth: редірект на сторінку авторизації Riot із CSRF state.
// Callback приймається на /api/auth/riot/callback (= RIOT_REDIRECT_URI).
export async function GET() {
  const clientId = process.env.RIOT_CLIENT_ID
  const redirectUri = process.env.RIOT_REDIRECT_URI || `${getBaseUrl()}/api/auth/riot/callback`

  if (!clientId) {
    return NextResponse.redirect(`${getBaseUrl()}/profile?error=riot_not_configured`)
  }

  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid',
    state,
  })

  const res = NextResponse.redirect(`https://auth.riotgames.com/authorize?${params.toString()}`)
  res.cookies.set('riot_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
