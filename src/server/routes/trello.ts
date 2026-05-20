import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(import.meta.dir, '..', '..', '..', 'data')
const DB_PATH = join(DATA_DIR, 'trello.db')

function getDb(): Database {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  const db = new Database(DB_PATH)
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      items TEXT NOT NULL,
      board_url TEXT,
      created_at TEXT NOT NULL
    )
  `)
  return db
}

function migrateDb(db: Database): void {
  try {
    db.run('ALTER TABLE projects ADD COLUMN board_url TEXT')
  } catch {
    // Column already exists — ignore
  }
}

function extractBoardId(boardUrl: string): string | null {
  // Match Trello URL format: https://trello.com/b/{boardId}/...
  // Or just a raw board ID
  const urlMatch = boardUrl.match(/trello\.com\/b\/([a-zA-Z0-9]+)/)
  if (urlMatch) return urlMatch[1]
  // If it looks like a raw alphanumeric ID, use it directly
  if (/^[a-zA-Z0-9]+$/.test(boardUrl)) return boardUrl
  return null
}

function mapListNameToStatus(listName: string): string {
  const lower = listName.toLowerCase()
  if (lower.includes('done') || lower.includes('complete') || lower.includes('finished')) return 'Done'
  if (lower.includes('in progress') || lower.includes('working') || lower.includes('doing')) return 'In Progress'
  if (lower.includes('backlog')) return 'Backlog'
  if (lower.includes('to do') || lower.includes('todo') || lower.includes('to-do')) return 'To Do'
  return 'To Do'
}

interface TrelloCard {
  id: string
  name: string
  due: string | null
  dueComplete: boolean
  idList: string
  idLabels: string[]
  url: string
}

interface TrelloList {
  id: string
  name: string
}

interface TrelloLabel {
  id: string
  name: string
  color: string | null
}

export async function handleTrello(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const method = req.method

  // POST /api/trello/import — import from Trello API
  if (method === 'POST' && url.pathname === '/api/trello/import') {
    let body: { boardUrl?: string; apiKey?: string; token?: string }
    try {
      body = (await req.json()) as { boardUrl?: string; apiKey?: string; token?: string }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!body.boardUrl || !body.apiKey || !body.token) {
      return new Response(JSON.stringify({ error: 'Missing required fields: boardUrl, apiKey, token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const boardId = extractBoardId(body.boardUrl)
    if (!boardId) {
      return new Response(JSON.stringify({ error: 'Invalid Trello board URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const auth = `key=${encodeURIComponent(body.apiKey)}&token=${encodeURIComponent(body.token)}`

    try {
      // Fetch board info
      const boardRes = await fetch(`https://api.trello.com/1/boards/${boardId}?fields=name&${auth}`)
      if (!boardRes.ok) {
        const errText = await boardRes.text()
        return new Response(JSON.stringify({ error: `Trello API error (board): ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const boardData = (await boardRes.json()) as { name: string; id: string }

      // Fetch lists
      const listsRes = await fetch(`https://api.trello.com/1/boards/${boardId}/lists?fields=name&${auth}`)
      if (!listsRes.ok) {
        const errText = await listsRes.text()
        return new Response(JSON.stringify({ error: `Trello API error (lists): ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const listsData = (await listsRes.json()) as TrelloList[]

      // Fetch labels
      const labelsRes = await fetch(`https://api.trello.com/1/boards/${boardId}/labels?fields=name,color&${auth}`)
      if (!labelsRes.ok) {
        const errText = await labelsRes.text()
        return new Response(JSON.stringify({ error: `Trello API error (labels): ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const labelsData = (await labelsRes.json()) as TrelloLabel[]

      // Fetch cards
      const cardsRes = await fetch(
        `https://api.trello.com/1/boards/${boardId}/cards?fields=name,due,dueComplete,idList,idLabels,idMembers,url&${auth}`,
      )
      if (!cardsRes.ok) {
        const errText = await cardsRes.text()
        return new Response(JSON.stringify({ error: `Trello API error (cards): ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const cardsData = (await cardsRes.json()) as TrelloCard[]

      // Build list lookup
      const listMap = new Map<string, string>()
      for (const list of listsData) {
        listMap.set(list.id, list.name)
      }

      // Build label lookup
      const labelMap = new Map<string, TrelloLabel>()
      for (const label of labelsData) {
        labelMap.set(label.id, label)
      }

      // Build items array
      const items = cardsData.map((card) => {
        const listName = listMap.get(card.idList) ?? 'Unknown'
        const labels = card.idLabels.map((id) => labelMap.get(id)).filter(Boolean) as TrelloLabel[]

        return {
          id: card.id,
          title: card.name,
          url: card.url,
          due: card.due ?? null,
          dueComplete: card.dueComplete,
          listName,
          status: mapListNameToStatus(listName),
          labels,
          startDate: null,
        }
      })

      return new Response(
        JSON.stringify({
          boardName: boardData.name,
          items,
          lists: listsData,
          labels: labelsData,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ error: `Failed to fetch Trello data: ${msg}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // POST /api/trello/save — save imported project to DB
  if (method === 'POST' && url.pathname === '/api/trello/save') {
    let body: { title?: string; items?: unknown[]; boardUrl?: string; id?: string }
    try {
      body = (await req.json()) as { title?: string; items?: unknown[]; boardUrl?: string; id?: string }
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

    const db = getDb()
    migrateDb(db)

    if (body.id) {
      const itemsJson = JSON.stringify(body.items)
      const title = body.title ?? 'Untitled Trello Project'
      db.run('UPDATE projects SET title = ?, items = ?, board_url = ? WHERE id = ?', [
        title,
        itemsJson,
        body.boardUrl ?? null,
        body.id,
      ])
      db.close()
      return new Response(JSON.stringify({ id: body.id, updated: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const id = crypto.randomUUID()
    const title = body.title ?? 'Untitled Trello Project'
    const itemsJson = JSON.stringify(body.items)
    const createdAt = new Date().toISOString()

    db.run('INSERT INTO projects (id, title, items, board_url, created_at) VALUES (?, ?, ?, ?, ?)', [
      id,
      title,
      itemsJson,
      body.boardUrl ?? null,
      createdAt,
    ])
    db.close()

    return new Response(JSON.stringify({ id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // POST /api/trello/:id/refresh — re-import from Trello and update the saved record
  const refreshMatch = url.pathname.match(/^\/api\/trello\/([a-f0-9-]+)\/refresh$/)
  if (refreshMatch && method === 'POST') {
    const projectId = refreshMatch[1]

    let body: { apiKey?: string; token?: string }
    try {
      body = (await req.json()) as { apiKey?: string; token?: string }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!body.apiKey || !body.token) {
      return new Response(JSON.stringify({ error: 'Missing required fields: apiKey, token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = getDb()
    migrateDb(db)
    const row = db.query('SELECT id, title, items, board_url FROM projects WHERE id = ?').get(projectId) as
      | { id: string; title: string; items: string; board_url: string | null }
      | undefined
    db.close()

    if (!row) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const boardUrl = row.board_url
    if (!boardUrl) {
      return new Response(JSON.stringify({ error: 'No board URL saved — cannot refresh' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const boardId = extractBoardId(boardUrl)
    if (!boardId) {
      return new Response(JSON.stringify({ error: 'Invalid saved board URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const auth = `key=${encodeURIComponent(body.apiKey)}&token=${encodeURIComponent(body.token)}`

    try {
      const [boardRes, listsRes, labelsRes, cardsRes] = await Promise.all([
        fetch(`https://api.trello.com/1/boards/${boardId}?fields=name&${auth}`),
        fetch(`https://api.trello.com/1/boards/${boardId}/lists?fields=name&${auth}`),
        fetch(`https://api.trello.com/1/boards/${boardId}/labels?fields=name,color&${auth}`),
        fetch(`https://api.trello.com/1/boards/${boardId}/cards?fields=name,due,dueComplete,idList,idLabels,idMembers,url&${auth}`),
      ])

      if (!boardRes.ok) {
        const errText = await boardRes.text()
        return new Response(JSON.stringify({ error: `Trello API error (board): ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (!listsRes.ok) {
        const errText = await listsRes.text()
        return new Response(JSON.stringify({ error: `Trello API error (lists): ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (!labelsRes.ok) {
        const errText = await labelsRes.text()
        return new Response(JSON.stringify({ error: `Trello API error (labels): ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (!cardsRes.ok) {
        const errText = await cardsRes.text()
        return new Response(JSON.stringify({ error: `Trello API error (cards): ${errText}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const boardData = (await boardRes.json()) as { name: string }
      const listsData = (await listsRes.json()) as TrelloList[]
      const labelsData = (await labelsRes.json()) as TrelloLabel[]
      const cardsData = (await cardsRes.json()) as TrelloCard[]

      const listMap = new Map<string, string>()
      for (const list of listsData) listMap.set(list.id, list.name)

      const labelMap = new Map<string, TrelloLabel>()
      for (const label of labelsData) labelMap.set(label.id, label)

      const items = cardsData.map((card) => {
        const listName = listMap.get(card.idList) ?? 'Unknown'
        const labels = card.idLabels.map((id) => labelMap.get(id)).filter(Boolean) as TrelloLabel[]
        return {
          id: card.id,
          title: card.name,
          url: card.url,
          due: card.due ?? null,
          dueComplete: card.dueComplete,
          listName,
          status: mapListNameToStatus(listName),
          labels,
          startDate: null,
        }
      })

      const db2 = getDb()
      migrateDb(db2)
      db2.run('UPDATE projects SET title = ?, items = ? WHERE id = ?', [
        boardData.name,
        JSON.stringify(items),
        projectId,
      ])
      db2.close()

      return new Response(JSON.stringify({ boardName: boardData.name, items }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ error: `Failed to refresh Trello data: ${msg}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // GET /api/trello/:id — retrieve a saved project
  const getMatch = url.pathname.match(/^\/api\/trello\/([a-f0-9-]+)$/)
  if (getMatch && method === 'GET') {
    const projectId = getMatch[1]

    const db = getDb()
    const row = db.query('SELECT id, title, items, board_url, created_at FROM projects WHERE id = ?').get(projectId) as
      | { id: string; title: string; items: string; board_url: string | null; created_at: string }
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
        board_url: row.board_url,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  return null
}
