import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PROGRESS } from '@/lib/gantt'
import type { GanttItem } from '@/lib/gantt'

const STATUS_COLORS: Record<string, string> = {
  Done: '#64CCC5',
  'In review': '#4988C4',
  'In progress': '#7B68EE',
  'To do': '#F4A261',
  Backlog: '#1e3a5f',
}

type Props = { items: GanttItem[] }

export default function StatusDonut({ items }: Props) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (PROGRESS[b.name] ?? 0) - (PROGRESS[a.name] ?? 0))

  return (
    <div className="flex flex-col">
      <div className="mb-1 text-sm font-medium text-[#e8f4fd]">Status distribution</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] ?? '#1e3a5f'}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0d2040',
              border: '1px solid #1e3a5f',
              borderRadius: 8,
              color: '#e8f4fd',
              fontSize: 12,
            }}
            formatter={(value, name) => [value, name]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: '#7aa3c8', fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
