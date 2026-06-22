import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BarChart2, Code2, Share2, Copy, Check, RefreshCw, FileDown } from 'lucide-react'
import { motion } from 'motion/react'
import { useItems, type ItemFilters } from '@/hooks/useItems'
import { getUniqueCodes, getUniqueAssignees, getUniqueIterations, getUniqueMilestones } from '@/lib/gantt'
import type { GanttItem } from '@/lib/gantt'
import { generateStandaloneHtml } from '@/lib/export'
import Shell from '@/components/layout/Shell'
import GanttChart from '@/components/gantt/GanttChart'
import GanttFilters from '@/components/gantt/GanttFilters'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

function EmbedDialog({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/gantt/${encodeURIComponent(projectId)}?embed=true`
  const snippet = `<iframe src="${url}" width="100%" height="500" frameborder="0"></iframe>`

  function copy() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Code2 size={14} />
          Embed
        </Button>
      </DialogTrigger>
      <DialogContent title="Embed Gantt">
        <p className="mb-3 text-xs text-[#7aa3c8]">
          Copy this snippet to embed the Gantt view in any page. Requires the project to be public.
        </p>
        <div className="relative rounded-md bg-[#07172e] border border-[#1e3a5f] p-3 font-mono text-xs text-[#7aa3c8] break-all">
          {snippet}
          <button
            onClick={copy}
            className="absolute right-2 top-2 rounded p-1 text-[#7aa3c8] hover:bg-[#1e3a5f] hover:text-[#e8f4fd] transition-colors"
          >
            {copied ? <Check size={13} className="text-[#64CCC5]" /> : <Copy size={13} />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShareDialog({ projectTitle, allItems }: { projectTitle: string; allItems: GanttItem[] }) {
  const [open, setOpen] = useState(false)
  const [shareId, setShareId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function createShare() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: projectTitle, items: allItems }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Failed to create share link')
      }
      const data = (await res.json()) as { shareId: string }
      setShareId(data.shareId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const shareUrl = shareId ? `${window.location.origin}/share/${shareId}` : ''

  function copyLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setShareId(null); setError(null); setCopied(false) } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 size={14} />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent title="Share Gantt">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4988C4] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : !shareId ? (
          <div>
            <p className="mb-4 text-xs text-[#7aa3c8]">
              Generate a shareable link that lets anyone view this Gantt chart without logging in.
            </p>
            <Button onClick={createShare} size="sm" className="gap-1.5">
              <Share2 size={14} />
              Generate link
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-xs text-[#7aa3c8]">
              Anyone with this link can view the Gantt chart. No login required.
            </p>
            <div className="relative rounded-md bg-[#07172e] border border-[#1e3a5f] p-3 font-mono text-xs text-[#7aa3c8] break-all">
              {shareUrl}
              <button
                onClick={copyLink}
                className="absolute right-2 top-2 rounded p-1 text-[#7aa3c8] hover:bg-[#1e3a5f] hover:text-[#e8f4fd] transition-colors"
              >
                {copied ? <Check size={13} className="text-[#64CCC5]" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function GanttRoute() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEmbed = searchParams.get('embed') === 'true'

  const [filters, setFilters] = useState<ItemFilters>({ codes: [], statuses: [], assignees: [], iterations: [], milestones: [] })

  const { items, allItems, isLoading, isRefetching, error, projectTitle, refetch } = useItems(projectId, filters)

  const availableCodes = useMemo(() => getUniqueCodes(allItems), [allItems])
  const availableAssignees = useMemo(() => getUniqueAssignees(allItems), [allItems])
  const availableIterations = useMemo(() => getUniqueIterations(allItems), [allItems])
  const availableMilestones = useMemo(() => getUniqueMilestones(allItems), [allItems])

  if (isEmbed) {
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#07172e]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4988C4] border-t-transparent" />
        </div>
      )
    }
    return (
      <div className="h-screen overflow-hidden bg-[#07172e]">
        <GanttChart items={items} />
      </div>
    )
  }

  return (
    <Shell>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Page header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#1e3a5f] px-5 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="h-8 w-8 text-[#7aa3c8]"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-[#e8f4fd]">
                {isLoading ? 'Loading...' : (projectTitle || 'Gantt Chart')}
              </h1>
              {!isLoading && (
                <p className="text-xs text-[#7aa3c8]">
                  {items.length} of {allItems.length} items
                  {isRefetching && <span className="ml-2 text-[#4988C4]">Updating...</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[#7aa3c8]"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[#7aa3c8]"
              onClick={() => navigate(`/metrics/${projectId}`)}
            >
              <BarChart2 size={14} />
              Metrics
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[#7aa3c8]"
              onClick={() => {
                const html = generateStandaloneHtml(allItems, projectTitle)
                const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_gantt.html`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <FileDown size={14} />
              Export
            </Button>
            <ShareDialog projectTitle={projectTitle} allItems={allItems} />
            <EmbedDialog projectId={projectId} />
          </div>
        </div>

        {/* Filters */}
        <GanttFilters
          availableCodes={availableCodes}
          availableAssignees={availableAssignees}
          availableIterations={availableIterations}
          availableMilestones={availableMilestones}
          filters={filters}
          onChange={setFilters}
        />

        {/* Chart area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4988C4] border-t-transparent" />
                <p className="text-xs text-[#7aa3c8]">Loading project items...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-lg border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-400">
                Failed to load project. Check access and try again.
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <GanttChart items={items} />
            </motion.div>
          )}
        </div>
      </div>
    </Shell>
  )
}
