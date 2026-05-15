import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, ExternalLink, ChevronRight, AlertTriangle, Columns3 } from 'lucide-react'
import { motion } from 'motion/react'
import { useAuth } from '@/hooks/useAuth'
import { useListProjects } from '@/hooks/useProject'
import Shell from '@/components/layout/Shell'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { timeAgo } from '@/lib/dates'
import type { ProjectNodeWithOwner, OrgNode } from '@/lib/github'

function ProjectCard({ project, index }: { project: ProjectNodeWithOwner; index: number }) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.22 }}
    >
      <button
        className="w-full text-left"
        onClick={() => navigate(`/gantt/${encodeURIComponent(project.id)}`)}
      >
        <Card className="cursor-pointer transition-colors hover:border-[#4988C4] hover:bg-[#0d2040]">
          <CardHeader>
            <div className="flex items-start gap-3">
              <FolderKanban size={18} className="mt-0.5 shrink-0 text-[#4988C4]" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm">{project.title}</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Updated {timeAgo(project.updatedAt)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                #{project.number}
              </Badge>
              <ChevronRight size={14} className="text-[#1e3a5f]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-[#7aa3c8] hover:text-[#4988C4] transition-colors"
              >
                <ExternalLink size={11} />
                Open in GitHub
              </a>
              <a
                href={`/metrics/${encodeURIComponent(project.id)}`}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/metrics/${encodeURIComponent(project.id)}`)
                  e.preventDefault()
                }}
                className="text-xs text-[#7aa3c8] hover:text-[#4988C4] transition-colors"
              >
                View metrics
              </a>
            </div>
          </CardContent>
        </Card>
      </button>
    </motion.div>
  )
}

export default function DashboardRoute() {
  const { user } = useAuth()
  const { data, isLoading, error } = useListProjects(user?.login ?? '')
  const projects = data?.projects ?? []
  const blockedOrgs: OrgNode[] = data?.blockedOrgs ?? []

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl?: string; projects: ProjectNodeWithOwner[] }>()
    for (const p of projects) {
      const key = p.ownerLogin
      if (!map.has(key)) {
        map.set(key, { name: p.ownerName, avatarUrl: p.ownerAvatarUrl, projects: [] })
      }
      map.get(key)!.projects.push(p)
    }
    return [...map.entries()].map(([login, val]) => ({ login, ...val }))
  }, [projects])

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#e8f4fd]">Projects</h2>
            <p className="text-sm text-[#7aa3c8]">Your personal and organization GitHub Projects</p>
          </div>

          {/* Trello Import Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="mb-4"
          >
            <button
              className="w-full text-left"
              onClick={() => navigate('/trello/import')}
            >
              <Card className="cursor-pointer transition-colors hover:border-[#4988C4] hover:bg-[#0d2040]">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Columns3 size={18} className="mt-0.5 shrink-0 text-[#4988C4]" />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm">Import from Trello</CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        Import a Trello board and view it as a Gantt chart
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-[#1e3a5f]" />
                  </div>
                </CardHeader>
              </Card>
            </button>
          </motion.div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4988C4] border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              Failed to load projects. Check your GitHub access and try again.
            </div>
          )}

          {blockedOrgs.length > 0 && (
            <div className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-yellow-900 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">
                    {blockedOrgs.length === 1
                      ? `Projects from "${blockedOrgs[0].login}" are not accessible.`
                      : `Projects from ${blockedOrgs.length} organizations are not accessible.`}
                  </p>
                  <p className="mt-1 text-yellow-500/80">
                    Your OAuth token may not include org access. Re-authorize to grant it, or ask an org
                    admin to approve this app at{' '}
                    <span className="font-mono text-xs">
                      github.com/organizations/{'<org>'}/settings/oauth_application_policy
                    </span>
                    .
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-yellow-800 bg-transparent text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300"
                onClick={() => { window.location.href = '/auth/github' }}
              >
                Re-authorize
              </Button>
            </div>
          )}

          {!isLoading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FolderKanban size={32} className="text-[#1e3a5f]" />
              <p className="text-sm text-[#7aa3c8]">No GitHub Projects found.</p>
              <a
                href="https://docs.github.com/en/issues/planning-and-tracking-with-projects"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#4988C4] hover:underline"
              >
                Learn how to create a Project
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          <div className="space-y-6">
            {grouped.map(({ login, name, avatarUrl, projects: ownerProjects }) => (
              <div key={login}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <Avatar
                    src={avatarUrl ?? `https://github.com/${login}.png`}
                    fallback={login}
                    size={20}
                  />
                  <span className="text-xs font-medium text-[#7aa3c8]">{name}</span>
                  <span className="text-xs text-[#1e3a5f]">{ownerProjects.length} project{ownerProjects.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid gap-2">
                  {ownerProjects.map((project, i) => (
                    <ProjectCard key={project.id} project={project} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Shell>
  )
}
