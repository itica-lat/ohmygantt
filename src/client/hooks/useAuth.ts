import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type AuthUser = {
  login: string
  avatarUrl: string
  name: string
}

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch('/auth/me', { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`auth_check_failed:${res.status}`)
  return res.json() as Promise<AuthUser>
}

async function logout(): Promise<void> {
  await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
}

export function useAuth() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: 800,
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
      queryClient.clear()
      window.location.href = '/'
    },
  })

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    logout: logoutMutation.mutate,
  }
}
