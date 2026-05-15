import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const DATA_DIR = join(import.meta.dir, '..', '..', '..', 'data')
const DB_PATH = join(DATA_DIR, 'shared.db')

function getDb(): Database {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  const db = new Database(DB_PATH)
  db.run(`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      items TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)
  return db
}

export async function handleShare(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const method = req.method

  // POST /api/share — create a new shared Gantt view
  if (method === 'POST' && url.pathname === '/api/share') {
    let body: { title?: string; items?: unknown[] }
    try {
      body = (await req.json()) as { title?: string; items?: unknown[] }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!body.items || !Array.isArray(body.items)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid items array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const shareId = crypto.randomUUID()
    const title = body.title ?? 'Untitled Gantt'
    const itemsJson = JSON.stringify(body.items)
    const createdAt = new Date().toISOString()

    const db = getDb()
    db.run('INSERT INTO shares (id, title, items, created_at) VALUES (?, ?, ?, ?)', [
      shareId,
      title,
      itemsJson,
      createdAt,
    ])
    db.close()

    return new Response(JSON.stringify({ shareId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // GET /api/share/:shareId — retrieve a shared Gantt view
  const shareMatch = url.pathname.match(/^\/api\/share\/([a-f0-9-]+)$/)
  if (shareMatch && method === 'GET') {
    const shareId = shareMatch[1]

    const db = getDb()
    const row = db.query('SELECT id, title, items, created_at FROM shares WHERE id = ?').get(shareId) as
      | { id: string; title: string; items: string; created_at: string }
      | undefined
    db.close()

    if (!row) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        id: row.id,
        title: row.title,
        items: JSON.parse(row.items),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  return null
}
