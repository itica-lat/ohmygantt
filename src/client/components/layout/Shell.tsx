import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Header from './Header'

export default function Shell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07172e]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4988C4] border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="flex h-screen flex-col bg-[#07172e] text-[#e8f4fd]">
      <Header />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
