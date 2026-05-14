export type ManualTask = {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  dependencies: string[]
  startDate: string | null
  endDate: string | null
  createdAt: number
  updatedAt: number
}

export type ManualProject = {
  id: string
  title: string
  tasks: ManualTask[]
  sessionId: string
  shareId: string | null
  createdAt: number
  updatedAt: number
}

export type ManualProjectSummary = {
  id: string
  title: string
  taskCount: number
  shareId: string | null
  updatedAt: number
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function createManualProject(title: string): Promise<ManualProject> {
  return req('/api/manual', { method: 'POST', body: JSON.stringify({ title }) })
}

export function getManualProject(id: string): Promise<ManualProject> {
  return req(`/api/manual/${id}`)
}

export function updateManualProject(id: string, data: { title?: string; tasks?: ManualTask[] }): Promise<ManualProject> {
  return req(`/api/manual/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteManualProject(id: string): Promise<void> {
  return req(`/api/manual/${id}`, { method: 'DELETE' })
}

export function listManualProjects(): Promise<ManualProjectSummary[]> {
  return req('/api/manual')
}

export function generateShareLink(projectId: string): Promise<{ shareId: string }> {
  return req(`/api/manual/${projectId}/share`, { method: 'POST' })
}

export function revokeShareLink(projectId: string): Promise<void> {
  return req(`/api/manual/${projectId}/share`, { method: 'DELETE' })
}

export function getSharedProject(shareId: string): Promise<{ id: string; title: string; tasks: ManualTask[] }> {
  return req(`/api/manual/shared/${shareId}`)
}
