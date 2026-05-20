import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart2, ExternalLink, RefreshCw } from 'lucide-react'
import type { GanttItem } from '@/lib/gantt'
import GanttChart from '@/components/gantt/GanttChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type TrelloBoard = {
  id: string
  name: string
  items: TrelloItem[]
  board_url?: string | null
}

type TrelloItem = {
  id: string
  title: string
  startDate: string | null
  due: string | null
  listName: string
  url: string
  labels: Array<{ name: string; color: string }>
}

export default function TrelloViewRoute() {
  const { id = '' } = useParams<{ id: string }>()
  const [data, setData] = useState<TrelloBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [refreshing, setRefreshing] = useState(false)
  const [showRefreshForm, setShowRefreshForm] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [token, setToken] = useState('')
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const loadBoard = () => {
    setLoading(true)
    setError(null)

    fetch(`/api/trello/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Trello board not found.')
          throw new Error('Failed to load Trello board.')
        }
        return res.json() as Promise<TrelloBoard>
      })
      .then((result) => {
        setData(result)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadBoard()
  }, [id])

  const handleRefresh = async (e: React.FormEvent) => {
    e.preventDefault()
    setRefreshError(null)
    setRefreshing(true)

    try {
      const res = await fetch(`/api/trello/${encodeURIComponent(id)}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), token: token.trim() }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? 'Refresh failed')
      }

      const result = await res.json()
      setData((prev) => prev ? { ...prev, name: result.boardName, items: result.items } : prev)
      setShowRefreshForm(false)
      setApiKey('')
      setToken('')
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Refresh failed. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  const items = useMemo((): GanttItem[] => {
    if (!data) return []
    return data.items.map((item, index) => {
      const now = new Date()
      const start = item.startDate
        ? new Date(item.startDate)
        : item.due
          ? new Date(new Date(item.due).getTime() - 7 * 86400000)
          : now

      const end = item.due
        ? new Date(item.due)
        : new Date(now.getTime() + 7 * 86400000)

      const listNameLower = (item.listName ?? '').toLowerCase()
      let status: string
      if (listNameLower === 'done' || listNameLower === 'complete') {
        status = 'Done'
      } else if (listNameLower === 'in progress') {
        status = 'In progress'
      } else {
        status = 'To do'
      }

      return {
        id: item.id,
        title: item.title,
        code: 'TRL',
        start,
        end,
        status,
        assignees: [],
        progress: status === 'Done' ? 1 : 0,
        issueNumber: index + 1,
        url: item.url,
        labels: item.labels ?? [],
        iteration: null,
        milestone: null,
      }
    })
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
            {data?.name ?? 'Trello Board'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs text-[#7aa3c8] border-[#1e3a5f]">
            <ExternalLink size={11} className="mr-1" />
            Imported view
          </Badge>
          <button
            onClick={() => setShowRefreshForm(!showRefreshForm)}
            className="flex items-center gap-1 text-xs text-[#7aa3c8] hover:text-[#4988C4] transition-colors"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </header>

      {showRefreshForm && (
        <div className="border-b border-[#1e3a5f] bg-[#0d2040] px-5 py-4">
          <form onSubmit={handleRefresh} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-[#7aa3c8] mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Trello API key"
                className="w-full h-8 px-3 rounded border border-[#1e3a5f] bg-[#07172e] text-sm text-[#e8f4fd] placeholder-[#4a6f8f] focus:outline-none focus:ring-1 focus:ring-[#4988C4]"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-[#7aa3c8] mb-1">Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Trello token"
                className="w-full h-8 px-3 rounded border border-[#1e3a5f] bg-[#07172e] text-sm text-[#e8f4fd] placeholder-[#4a6f8f] focus:outline-none focus:ring-1 focus:ring-[#4988C4]"
              />
            </div>
            <Button type="submit" disabled={refreshing || !apiKey.trim() || !token.trim()} size="sm" className="h-8">
              {refreshing ? (
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Syncing...
                </span>
              ) : (
                'Sync'
              )}
            </Button>
          </form>
          {refreshError && (
            <p className="mt-2 text-xs text-red-400">{refreshError}</p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[#7aa3c8]">
            No items found in this Trello board.
          </div>
        ) : (
          <GanttChart items={items} />
        )}
      </div>
    </div>
  )
}
