import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Columns3, ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TrelloImportRoute() {
  const navigate = useNavigate()
  const [boardUrl, setBoardUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getBoardId = (url: string): string | null => {
    const match = url.match(/trello\.com\/[a-z]+\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const boardId = getBoardId(boardUrl.trim())
    if (!boardId) {
      setError('Invalid Trello board URL. Please enter a valid URL like https://trello.com/b/ABC123/...')
      return
    }

    if (!apiKey.trim()) {
      setError('Please enter your Trello API key.')
      return
    }

    if (!token.trim()) {
      setError('Please enter your Trello token.')
      return
    }

    setLoading(true)

    try {
      const importRes = await fetch('/api/trello/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, apiKey: apiKey.trim(), token: token.trim() }),
      })

      if (!importRes.ok) {
        const errData = await importRes.json().catch(() => null)
        throw new Error(errData?.error ?? `Import failed with status ${importRes.status}`)
      }

      const importData = await importRes.json()

      const saveRes = await fetch('/api/trello/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: importData.id, name: importData.name, items: importData.items }),
      })

      if (!saveRes.ok) {
        throw new Error('Failed to save imported board.')
      }

      const saveData = await saveRes.json()

      navigate(`/trello/${saveData.id ?? importData.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07172e] text-[#e8f4fd]">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#1e3a5f] bg-[#07172e] px-5">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-xs text-[#7aa3c8] hover:text-[#4988C4] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <span className="text-[#1e3a5f]">|</span>
        <Columns3 size={18} className="text-[#4988C4]" />
        <span className="font-semibold text-sm tracking-wide">Import from Trello</span>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#e8f4fd]">Trello Board Import</h2>
            <p className="mt-1 text-sm text-[#7aa3c8]">
              Import your Trello board as a Gantt chart. You'll need a Trello API key and token.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="boardUrl" className="block text-xs font-medium text-[#7aa3c8] mb-1.5">
                Board URL
              </label>
              <input
                id="boardUrl"
                type="text"
                value={boardUrl}
                onChange={(e) => setBoardUrl(e.target.value)}
                placeholder="https://trello.com/b/ABC123/..."
                className="w-full h-9 px-3 rounded-md border border-[#1e3a5f] bg-[#0d2040] text-sm text-[#e8f4fd] placeholder-[#4a6f8f] focus:outline-none focus:ring-2 focus:ring-[#4988C4] focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-xs font-medium text-[#7aa3c8] mb-1.5">
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Trello API key"
                className="w-full h-9 px-3 rounded-md border border-[#1e3a5f] bg-[#0d2040] text-sm text-[#e8f4fd] placeholder-[#4a6f8f] focus:outline-none focus:ring-2 focus:ring-[#4988C4] focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="token" className="block text-xs font-medium text-[#7aa3c8] mb-1.5">
                Token
              </label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Your Trello token"
                className="w-full h-9 px-3 rounded-md border border-[#1e3a5f] bg-[#0d2040] text-sm text-[#e8f4fd] placeholder-[#4a6f8f] focus:outline-none focus:ring-2 focus:ring-[#4988C4] focus:border-transparent transition-colors"
              />
            </div>

            <div className="pt-1">
              <a
                href="https://trello.com/app-key"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#4988C4] hover:underline"
              >
                <ExternalLink size={11} />
                Get Trello API credentials
              </a>
            </div>

            {error && (
              <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Importing...
                </span>
              ) : (
                'Import'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
