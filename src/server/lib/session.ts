import type { Session, SessionStore } from '../types'

const COOKIE_NAME = 'session_id'
const TTL = 8 * 60 * 60 * 1000

export const sessions: SessionStore = new Map()

setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (session.expiresAt < now) sessions.delete(id)
  }
}, 60_000)

export function createSession(data: Omit<Session, 'expiresAt'>): string {
  const id = crypto.randomUUID()
  sessions.set(id, { ...data, expiresAt: Date.now() + TTL })
  return id
}

export function getSession(id: string): Session | null {
  const session = sessions.get(id)
  if (!session) return null
  if (session.expiresAt < Date.now()) {
    sessions.delete(id)
    return null
  }
  return session
}

export function deleteSession(id: string): void {
  sessions.delete(id)
}

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

export async function signCookie(value: string): Promise<string> {
  const sig = await hmac(value)
  return `${value}.${sig}`
}

export async function verifyCookie(signed: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const sig = signed.slice(lastDot + 1)
  const expected = await hmac(value)
  if (sig !== expected) return null
  return value
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k.trim(), decodeURIComponent(v.join('='))]
    })
  )
}

export async function getSessionFromRequest(req: Request): Promise<Session | null> {
  const cookies = parseCookies(req.headers.get('cookie'))
  const signed = cookies[COOKIE_NAME]
  if (!signed) return null
  const id = await verifyCookie(signed)
  if (!id) return null
  return getSession(id)
}

export function makeCookieHeader(signed: string, isProduction: boolean, clear = false): string {
  const parts = [
    `${COOKIE_NAME}=${clear ? '' : encodeURIComponent(signed)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${clear ? '0' : String(8 * 60 * 60)}`,
  ]
  if (isProduction) parts.push('Secure')
  return parts.join('; ')
}
