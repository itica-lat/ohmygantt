const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_API_URL = 'https://api.github.com'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-prod'

async function hmac(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const stateStore = new Map<string, number>()

setInterval(() => {
  const now = Date.now()
  for (const [state, ts] of stateStore) {
    if (now - ts > 600_000) stateStore.delete(state)
  }
}, 60_000)

export async function generateState(): Promise<string> {
  const nonce = crypto.randomUUID()
  const state = `${nonce}.${await hmac(nonce)}`
  stateStore.set(state, Date.now())
  return state
}

export async function validateState(state: string): Promise<boolean> {
  if (!stateStore.has(state)) return false
  stateStore.delete(state)
  const lastDot = state.lastIndexOf('.')
  if (lastDot === -1) return false
  const nonce = state.slice(0, lastDot)
  const sig = state.slice(lastDot + 1)
  const expected = await hmac(nonce)
  return sig === expected
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID ?? '',
    scope: 'read:project,read:org,repo,read:user',
    state,
    redirect_uri: `${process.env.VITE_APP_URL ?? 'http://localhost:5173'}/auth/callback`,
  })
  return `${GITHUB_AUTH_URL}?${params}`
}

export async function exchangeCode(code: string): Promise<string> {
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const data = (await res.json()) as { access_token?: string; error?: string }
  if (!data.access_token) throw new Error(data.error ?? 'No token received')
  return data.access_token
}

export async function fetchGithubUser(token: string): Promise<{
  login: string
  avatar_url: string
  name: string | null
}> {
  const res = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GanttApp/1.0',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch GitHub user')
  return res.json() as Promise<{ login: string; avatar_url: string; name: string | null }>
}
