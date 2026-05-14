import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { startOfDay, addDays, daysBetween, formatDate } from '@/lib/dates'
import type { GanttItem } from '@/lib/gantt'

type Props = { items: GanttItem[] }

export default function BurndownChart({ items }: Props) {
  if (items.length === 0) return null

  const total = items.length
  const starts = items.map((i) => i.start.getTime())
  const ends = items.map((i) => i.end.getTime())
  const projectStart = startOfDay(new Date(Math.min(...starts)))
  const projectEnd = startOfDay(new Date(Math.max(...ends)))
  const today = startOfDay(new Date())

  const totalDays = daysBetween(projectStart, projectEnd)
  if (totalDays <= 0) return null

  const data: Array<{ date: string; actual: number; ideal: number }> = []
  let closedSoFar = 0

  for (let d = 0; d <= Math.min(totalDays, daysBetween(projectStart, today)); d++) {
    const date = addDays(projectStart, d)
    const closedOnDay = items.filter(
      (i) => i.status === 'Done' && startOfDay(i.end).getTime() === date.getTime()
    ).length
    closedSoFar += closedOnDay

    const ideal = Math.round(total - (total * d) / totalDays)
    const actual = total - closedSoFar

    if (d % 7 === 0 || d === totalDays) {
      data.push({ date: formatDate(date), actual, ideal })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-1 text-sm font-medium text-[#e8f4fd]">Burndown</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis
            dataKey="date"
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
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#1e3a5f"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
            name="Ideal"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#4988C4"
            strokeWidth={2}
            dot={false}
            name="Actual"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
