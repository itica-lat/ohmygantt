import {
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listProjects,
  generateShareId,
  revokeShare,
  getProjectByShareId,
  ensureManualSession,
  getManualSessionId,
} from '../lib/manual'

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handleManual(req: Request): Promise<Response | null> {
  const url = new URL(req.url)
  const method = req.method

  if (method === 'POST' && url.pathname === '/api/manual') {
    const { sessionId, cookie } = ensureManualSession(req)
    let title = 'Untitled Project'
    try {
      const body = (await req.json()) as { title?: string }
      if (body.title) title = body.title
    } catch {}
    const project = createProject(title, sessionId)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (cookie) headers['Set-Cookie'] = cookie
    return new Response(JSON.stringify(project), { status: 201, headers })
  }

  if (method === 'GET' && url.pathname === '/api/manual') {
    const sessionId = getManualSessionId(req)
    if (!sessionId) return jsonResponse([])
    const result = listProjects(sessionId).map((p) => ({
      id: p.id,
      title: p.title,
      taskCount: p.tasks.length,
      shareId: p.shareId,
      updatedAt: p.updatedAt,
    }))
    return jsonResponse(result)
  }

  const projectMatch = url.pathname.match(/^\/api\/manual\/([a-f0-9-]+)$/)
  if (projectMatch && method === 'GET') {
    const id = projectMatch[1]
    const sessionId = getManualSessionId(req)
    const project = getProject(id)
    if (!project) return jsonResponse({ error: 'Not found' }, 404)
    if (project.sessionId !== sessionId) return jsonResponse({ error: 'Forbidden' }, 403)
    return jsonResponse(project)
  }

  if (projectMatch && method === 'PUT') {
    const id = projectMatch[1]
    const sessionId = getManualSessionId(req)
    const project = getProject(id)
    if (!project) return jsonResponse({ error: 'Not found' }, 404)
    if (project.sessionId !== sessionId) return jsonResponse({ error: 'Forbidden' }, 403)
    try {
      const body = (await req.json()) as { title?: string; tasks?: import('../types').ManualTask[] }
      const updated = updateProject(id, body)
      return jsonResponse(updated)
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400)
    }
  }

  if (projectMatch && method === 'DELETE') {
    const id = projectMatch[1]
    const sessionId = getManualSessionId(req)
    const project = getProject(id)
    if (!project) return jsonResponse({ error: 'Not found' }, 404)
    if (project.sessionId !== sessionId) return jsonResponse({ error: 'Forbidden' }, 403)
    deleteProject(id)
    return jsonResponse({ ok: true })
  }

  const shareMatch = url.pathname.match(/^\/api\/manual\/([a-f0-9-]+)\/share$/)
  if (shareMatch && method === 'POST') {
    const id = shareMatch[1]
    const sessionId = getManualSessionId(req)
    const project = getProject(id)
    if (!project) return jsonResponse({ error: 'Not found' }, 404)
    if (project.sessionId !== sessionId) return jsonResponse({ error: 'Forbidden' }, 403)
    const shareId = generateShareId(id)
    return jsonResponse({ shareId })
  }

  if (shareMatch && method === 'DELETE') {
    const id = shareMatch[1]
    const sessionId = getManualSessionId(req)
    const project = getProject(id)
    if (!project) return jsonResponse({ error: 'Not found' }, 404)
    if (project.sessionId !== sessionId) return jsonResponse({ error: 'Forbidden' }, 403)
    revokeShare(id)
    return jsonResponse({ ok: true })
  }

  const sharedMatch = url.pathname.match(/^\/api\/manual\/shared\/([a-f0-9-]+)$/)
  if (sharedMatch && method === 'GET') {
    const shareId = sharedMatch[1]
    const project = getProjectByShareId(shareId)
    if (!project) return jsonResponse({ error: 'Not found' }, 404)
    return jsonResponse({
      id: project.id,
      title: project.title,
      tasks: project.tasks,
    })
  }

  return null
}
