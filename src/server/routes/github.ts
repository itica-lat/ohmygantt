import { getSessionFromRequest, parseCookies, verifyCookie } from '../lib/session'
import { proxyGraphQL } from '../lib/proxy'

export async function handleGitHub(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  if (url.pathname !== '/api/github' || req.method !== 'POST') return null

  const session = await getSessionFromRequest(req)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const cookies = parseCookies(req.headers.get('cookie'))
  const signed = cookies['session_id'] ?? ''
  const sessionId = (await verifyCookie(signed)) ?? 'unknown'

  return proxyGraphQL(session.token, sessionId, body)
}
