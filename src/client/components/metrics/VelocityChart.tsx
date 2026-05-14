import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { startOfDay } from '@/lib/dates'
import type { GanttItem } from '@/lib/gantt'

type Props = { items: GanttItem[] }

function getWeekLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

function getWeekStart(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  d.setDate(d.getDate() - ((day + 6) % 7))
  return d
}

export default function VelocityChart({ items }: Props) {
  const closed = items.filter((i) => i.status === 'Done')
  if (closed.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[#7aa3c8]">
        No completed items yet
      </div>
    )
  }

  const byWeek = new Map<string, number>()
  for (const item of closed) {
    const ws = getWeekStart(item.end)
    const key = ws.toISOString()
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1)
  }

  const sorted = [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([iso, count]) => ({ week: getWeekLabel(new Date(iso)), count }))

  return (
    <div className="flex flex-col">
      <div className="mb-1 text-sm font-medium text-[#e8f4fd]">Velocity (items/week)</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={sorted} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#7aa3c8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#7aa3c8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0d2040',
              border: '1px solid #1e3a5f',
              borderRadius: 8,
              color: '#e8f4fd',
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" fill="#4988C4" radius={[3, 3, 0, 0]} name="Items closed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
