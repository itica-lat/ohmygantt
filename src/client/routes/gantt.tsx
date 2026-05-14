import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BarChart2, Code2, Copy, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useItems, type ItemFilters } from '@/hooks/useItems'
import { getUniqueCodes, getUniqueAssignees, getUniqueIterations } from '@/lib/gantt'
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

export default function GanttRoute() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEmbed = searchParams.get('embed') === 'true'

  const [filters, setFilters] = useState<ItemFilters>({ codes: [], statuses: [], assignees: [], iterations: [] })

  const { items, allItems, isLoading, error, projectTitle } = useItems(projectId, filters)

  const availableCodes = useMemo(() => getUniqueCodes(allItems), [allItems])
  const availableAssignees = useMemo(() => getUniqueAssignees(allItems), [allItems])
  const availableIterations = useMemo(() => getUniqueIterations(allItems), [allItems])

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
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[#7aa3c8]"
              onClick={() => navigate(`/metrics/${projectId}`)}
            >
              <BarChart2 size={14} />
              Metrics
            </Button>
            <EmbedDialog projectId={projectId} />
          </div>
        </div>

        {/* Filters */}
        <GanttFilters
          availableCodes={availableCodes}
          availableAssignees={availableAssignees}
          availableIterations={availableIterations}
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
