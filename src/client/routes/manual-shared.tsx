import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart2, ExternalLink } from 'lucide-react'
import { getSharedProject } from '@/lib/manual'
import type { ManualTask } from '@/lib/manual'
import { mapManualTaskToGantt } from '@/lib/gantt'
import GanttChart from '@/components/gantt/GanttChart'

export default function ManualSharedRoute() {
  const { shareId = '' } = useParams<{ shareId: string }>()
  const [data, setData] = useState<{ id: string; title: string; tasks: ManualTask[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSharedProject(shareId)
      .then(setData)
      .catch(() => setError('Project not found or share link is invalid.'))
      .finally(() => setLoading(false))
  }, [shareId])

  const items = useMemo(() => {
    if (!data) return []
    return data.tasks.map((t, i) => mapManualTaskToGantt(t, i))
  }, [data])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07172e]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4988C4] border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#07172e] px-4 text-center">
        <BarChart2 size={32} className="text-[#1e3a5f]" />
        <p className="text-sm text-[#7aa3c8]">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#07172e] text-[#e8f4fd]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1e3a5f] bg-[#07172e] px-5">
        <div className="flex items-center gap-3">
          <BarChart2 size={20} className="text-[#4988C4]" />
          <span className="font-semibold text-sm tracking-wide">Gantt</span>
          <span className="text-[#1e3a5f]">/</span>
          <span className="text-sm text-[#e8f4fd] font-medium">
            {data?.title ?? 'Shared Project'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7aa3c8]">
          <ExternalLink size={12} />
          Shared view
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[#7aa3c8]">
            No tasks in this project.
          </div>
        ) : (
          <GanttChart items={items} />
        )}
      </div>
    </div>
  )
}
