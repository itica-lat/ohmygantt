const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'

const rateLimits = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [id, limit] of rateLimits) {
    if (now > limit.resetAt) rateLimits.delete(id)
  }
}, 60_000)

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now()
  const limit = rateLimits.get(sessionId)
  if (!limit || now > limit.resetAt) {
    rateLimits.set(sessionId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (limit.count >= 100) return false
  limit.count++
  return true
}

export async function proxyGraphQL(
  token: string,
  sessionId: string,
  body: unknown
): Promise<Response> {
  if (!checkRateLimit(sessionId)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'GanttApp/1.0',
      Accept: 'application/vnd.github.v4+json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
