import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BarChart2, PenLine, Plus, Pencil, Clock } from 'lucide-react'

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
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { createManualProject, listManualProjects } from '@/lib/manual'
import type { ManualProjectSummary } from '@/lib/manual'

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [prevProjects, setPrevProjects] = useState<ManualProjectSummary[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (menuOpen) {
      listManualProjects().then(setPrevProjects).catch(() => {})
    }
  }, [menuOpen])

  async function handleNewProject() {
    setCreating(true)
    try {
      const project = await createManualProject('My Project')
      setMenuOpen(false)
      navigate(`/manual/${project.id}/edit`)
    } catch {
      setCreating(false)
    }
  }

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
          Generate interactive Gantt charts and progress metrics from GitHub Projects or create
          your own task list manually.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button asChild size="lg" className="gap-2.5 px-6 w-full">
            <a href="/auth/github">
              <GithubIcon size={18} />
              Login with GitHub
            </a>
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#1e3a5f]" />
            <span className="text-xs text-[#1e3a5f]">or</span>
            <div className="h-px flex-1 bg-[#1e3a5f]" />
          </div>

          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="gap-2.5 px-6 w-full">
                <PenLine size={18} />
                Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent title="Manual Projects">
              <div className="space-y-4">
                <button
                  onClick={handleNewProject}
                  disabled={creating}
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#1e3a5f] px-4 py-3 text-left text-[#7aa3c8] hover:border-[#4988C4] hover:text-[#e8f4fd] hover:bg-[#07172e] transition-colors disabled:opacity-50"
                >
                  <Plus size={18} className="text-[#4988C4]" />
                  <div>
                    <div className="text-sm font-medium">Create new project</div>
                    <div className="text-xs text-[#7aa3c8]">Start from scratch with a blank task list</div>
                  </div>
                </button>

                {prevProjects.length > 0 && (
                  <>
                    <div className="h-px bg-[#1e3a5f]" />
                    <div className="space-y-1 max-h-60 overflow-auto">
                      {prevProjects.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-lg border border-[#1e3a5f] bg-[#07172e] px-3 py-2.5"
                        >
                          <Link
                            to={`/manual/${p.id}`}
                            onClick={() => setMenuOpen(false)}
                            className="min-w-0 flex-1 text-left hover:text-white transition-colors"
                          >
                            <div className="truncate text-sm text-[#e8f4fd]">{p.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-[#7aa3c8]">{p.taskCount} tasks</span>
                              <span className="text-[#1e3a5f]">·</span>
                              <span className="flex items-center gap-1 text-xs text-[#7aa3c8]">
                                <Clock size={10} />
                                {formatTimeAgo(p.updatedAt)}
                              </span>
                            </div>
                          </Link>
                          <Link
                            to={`/manual/${p.id}`}
                            onClick={() => setMenuOpen(false)}
                            className="rounded p-1.5 text-[#7aa3c8] hover:bg-[#1e3a5f] hover:text-[#e8f4fd] transition-colors"
                          >
                            <BarChart2 size={14} />
                          </Link>
                          <Link
                            to={`/manual/${p.id}/edit`}
                            onClick={() => setMenuOpen(false)}
                            className="rounded p-1.5 text-[#7aa3c8] hover:bg-[#1e3a5f] hover:text-[#e8f4fd] transition-colors"
                          >
                            <Pencil size={14} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {prevProjects.length === 0 && (
                  <p className="text-xs text-[#1e3a5f] text-center pt-2">
                    No previous projects found.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-xs text-[#1e3a5f] max-w-xs">
          Manual mode requires no login. Projects are stored temporarily and can be shared via URL.
        </p>
      </motion.div>

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
