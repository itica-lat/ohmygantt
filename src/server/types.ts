export type Session = {
  token: string
  login: string
  avatarUrl: string
  name: string
  expiresAt: number
}

export type SessionStore = Map<string, Session>
