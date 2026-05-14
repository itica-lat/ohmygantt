import {
  generateState,
  validateState,
  buildAuthUrl,
  exchangeCode,
  fetchGithubUser,
} from '../lib/oauth'
import {
  createSession,
  deleteSession,
  getSessionFromRequest,
  signCookie,
  makeCookieHeader,
  parseCookies,
  verifyCookie,
} from '../lib/session'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const APP_URL = process.env.VITE_APP_URL ?? 'http://localhost:5173'

export async function handleAuth(req: Request): Promise<Response | null> {
  const url = new URL(req.url)

  if (url.pathname === '/auth/github' && req.method === 'GET') {
    const state = await generateState()
    return new Response(null, {
      status: 302,
      headers: { Location: buildAuthUrl(state) },
    })
  }

  if (url.pathname === '/auth/callback' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code || !state) {
      return new Response('Missing code or state', { status: 400 })
    }

    if (!(await validateState(state))) {
      return new Response('Invalid state', { status: 400 })
    }

    try {
      const token = await exchangeCode(code)
      const user = await fetchGithubUser(token)
      const sessionId = createSession({
        token,
        login: user.login,
        avatarUrl: user.avatar_url,
        name: user.name ?? user.login,
      })
      const signed = await signCookie(sessionId)
      const cookie = makeCookieHeader(signed, IS_PRODUCTION)

      return new Response(null, {
        status: 302,
        headers: { Location: `${APP_URL}/dashboard`, 'Set-Cookie': cookie },
      })
    } catch (err) {
      console.error('OAuth callback error:', err)
      return new Response('Authentication failed', { status: 500 })
    }
  }

  if (url.pathname === '/auth/logout' && req.method === 'POST') {
    const cookies = parseCookies(req.headers.get('cookie'))
    const signed = cookies['session_id']
    if (signed) {
      const id = await verifyCookie(signed)
      if (id) deleteSession(id)
    }
    const cookie = makeCookieHeader('', IS_PRODUCTION, true)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
    })
  }

  if (url.pathname === '/auth/me' && req.method === 'GET') {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(
      JSON.stringify({ login: session.login, avatarUrl: session.avatarUrl, name: session.name }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  return null
}
