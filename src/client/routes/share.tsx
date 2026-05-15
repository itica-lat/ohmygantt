import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart2, ExternalLink } from 'lucide-react'
import type { GanttItem } from '@/lib/gantt'
import GanttChart from '@/components/gantt/GanttChart'

type ShareData = {
  id: string
  title: string
  items: GanttItem[]
}

export default function ShareRoute() {
  const { shareId = '' } = useParams<{ shareId: string }>()
  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/share/${encodeURIComponent(shareId)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Shared Gantt not found or the link is invalid.')
          throw new Error('Failed to load shared Gantt.')
        }
        return res.json() as Promise<ShareData>
      })
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [shareId])

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

  const items = data?.items ?? []

  return (
    <div className="flex h-screen flex-col bg-[#07172e] text-[#e8f4fd]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1e3a5f] bg-[#07172e] px-5">
        <div className="flex items-center gap-3">
          <BarChart2 size={20} className="text-[#4988C4]" />
          <span className="font-semibold text-sm tracking-wide">Gantt</span>
          <span className="text-[#1e3a5f]">/</span>
          <span className="text-sm text-[#e8f4fd] font-medium">
            {data?.title ?? 'Shared view'}
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
            No items in this project.
          </div>
        ) : (
          <GanttChart items={items} />
        )}
      </div>
    </div>
  )
}
