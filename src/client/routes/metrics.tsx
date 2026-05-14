import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, GitBranch, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useItems } from '@/hooks/useItems'
import Shell from '@/components/layout/Shell'
import { Card } from '@/components/ui/card'
import BurndownChart from '@/components/metrics/BurndownChart'
import VelocityChart from '@/components/metrics/VelocityChart'
import StatusDonut from '@/components/metrics/StatusDonut'
import { Button } from '@/components/ui/button'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.FC<{ size?: number; color?: string }>
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <Card className="flex items-start gap-3">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}22` }}
      >
        <Icon size={16} color={color} />
      </div>
      <div>
        <div className="text-xl font-semibold text-[#e8f4fd]">{value}</div>
        <div className="text-xs text-[#7aa3c8]">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-[#1e3a5f]">{sub}</div>}
      </div>
    </Card>
  )
}

export default function MetricsRoute() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const { items, isLoading, error, projectTitle } = useItems(projectId)

  const total = items.length
  const done = items.filter((i) => i.status === 'Done').length
  const inProgress = items.filter((i) => i.status === 'In progress' || i.status === 'In review').length
  const noDate = items.filter((i) => {
    const now = new Date()
    return i.end < now && i.status !== 'Done'
  }).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/gantt/${projectId}`)}
              className="h-8 w-8 text-[#7aa3c8]"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-[#e8f4fd]">
                {isLoading ? 'Loading...' : (projectTitle || 'Metrics')}
              </h1>
              <p className="text-xs text-[#7aa3c8]">Project progress overview</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4988C4] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              Failed to load project data.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  icon={GitBranch}
                  label="Total items"
                  value={total}
                  color="#4988C4"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Completed"
                  value={`${done} (${pct}%)`}
                  color="#64CCC5"
                />
                <StatCard
                  icon={Clock}
                  label="In progress"
                  value={inProgress}
                  color="#7B68EE"
                />
                <StatCard
                  icon={AlertCircle}
                  label="Overdue"
                  value={noDate}
                  sub="past end date"
                  color="#F4A261"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <BurndownChart items={items} />
                </Card>
                <Card>
                  <VelocityChart items={items} />
                </Card>
              </div>

              <Card className="max-w-xs">
                <StatusDonut items={items} />
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </Shell>
  )
}
