import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2 } from 'lucide-react'

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
import { motion } from 'motion/react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07172e] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-8 text-center"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0d2040] border border-[#1e3a5f]">
            <BarChart2 size={24} className="text-[#4988C4]" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-semibold text-[#e8f4fd]" style={{ fontFamily: 'var(--font-display)' }}>
              Gantt
            </h1>
            <p className="text-xs text-[#7aa3c8]">by Eternum</p>
          </div>
        </div>

        <p className="max-w-sm text-[#7aa3c8] text-sm leading-relaxed">
          Connect your GitHub Projects and generate interactive Gantt charts and progress metrics.
          Your token never leaves the server.
        </p>

        <Button
          asChild
          size="lg"
          className="gap-2.5 px-6"
        >
          <a href="/auth/github">
            <GithubIcon size={18} />
            Login with GitHub
          </a>
        </Button>

        <p className="text-xs text-[#1e3a5f] max-w-xs">
          Requires read access to your GitHub Projects.
          We never store your token.
        </p>
      </motion.div>

      {/* Background decoration */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, #1C4D8D18, transparent)',
        }}
      />
    </div>
  )
}
