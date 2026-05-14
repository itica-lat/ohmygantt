import { ExternalLink } from 'lucide-react'
import GanttBar from './GanttBar'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getCodeColor } from '@/lib/gantt'
import { daysBetween, startOfDay } from '@/lib/dates'
import type { GanttItem } from '@/lib/gantt'

type Props = {
  item: GanttItem
  chartStart: Date
  dayWidth: number
  rowHeight: number
  totalWidth: number
  sidebarWidth: number
  isEven: boolean
}

export default function GanttRow({
  item,
  chartStart,
  dayWidth,
  rowHeight,
  totalWidth,
  sidebarWidth,
  isEven,
}: Props) {
  const start = startOfDay(chartStart)
  const itemStart = startOfDay(item.start)
  const itemEnd = startOfDay(item.end)

  const left = Math.max(0, daysBetween(start, itemStart)) * dayWidth
  const width = Math.max(1, daysBetween(itemStart, itemEnd)) * dayWidth

  const color = getCodeColor(item.code)

  return (
    <div
      className="flex"
      style={{ height: rowHeight, borderBottom: '1px solid #1e3a5f20' }}
    >
      <div
        className="flex shrink-0 items-center gap-2 px-3 sticky left-0 z-10"
        style={{
          width: sidebarWidth,
          height: rowHeight,
          backgroundColor: isEven ? '#07172e' : '#080e1c',
          borderRight: '1px solid #1e3a5f',
        }}
      >
        <div
          className="h-1.5 w-1.5 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0 flex-1">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1 text-xs text-[#e8f4fd] hover:text-white"
          >
            <span className="truncate">{item.title}</span>
            <ExternalLink
              size={10}
              className="shrink-0 text-[#7aa3c8] opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </a>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-mono text-[10px] text-[#7aa3c8]">#{item.issueNumber}</span>
            <Badge
              variant="code"
              className="px-1 py-0 leading-tight"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {item.code}
            </Badge>
          </div>
        </div>
        {item.assignees.slice(0, 2).map((a) => (
          <Avatar key={a.login} src={a.avatarUrl} fallback={a.login} size={20} className="shrink-0" />
        ))}
      </div>

      <div
        className="relative shrink-0"
        style={{
          width: totalWidth,
          height: rowHeight,
          backgroundColor: isEven ? '#07172e' : '#080e1c',
        }}
      >
        <GanttBar item={item} left={left} width={width} rowHeight={rowHeight} />
      </div>
    </div>
  )
}
