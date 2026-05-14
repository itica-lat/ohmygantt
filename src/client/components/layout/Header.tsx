import { Link } from 'react-router-dom'
import { BarChart2, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1e3a5f] bg-[#07172e] px-5">
      <Link to="/dashboard" className="flex items-center gap-2 text-[#e8f4fd] hover:text-white">
        <BarChart2 size={20} className="text-[#4988C4]" />
        <span className="font-semibold text-sm tracking-wide">Gantt</span>
      </Link>

      {user && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar src={user.avatarUrl} fallback={user.login} size={28} />
            <span className="text-sm text-[#7aa3c8]">{user.name || user.login}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
            <LogOut size={15} />
          </Button>
        </div>
      )}
    </header>
  )
}
