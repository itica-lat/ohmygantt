export type Session = {
  token: string
  login: string
  avatarUrl: string
  name: string
  expiresAt: number
}

export type SessionStore = Map<string, Session>

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
