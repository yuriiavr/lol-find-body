import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/src/lib/baseUrl'

export async function GET() {
  const appUrl = getBaseUrl()

  // CSRF state: випадковий токен у HttpOnly-cookie, який ми перевіримо в callback.
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    'openid.ns':         'http://specs.openid.net/auth/2.0',
    'openid.mode':       'checkid_setup',
    'openid.return_to':  `${appUrl}/api/auth/steam/callback?state=${state}`,
    'openid.realm':      appUrl,
    'openid.identity':   'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  const res = NextResponse.redirect(
    `https://steamcommunity.com/openid/login?${params.toString()}`
  )
  res.cookies.set('steam_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 хв
  })
  return res
}
