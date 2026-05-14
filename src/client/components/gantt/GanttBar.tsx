import { type CSSProperties } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { Avatar } from '@/components/ui/avatar'
import { getCodeColor } from '@/lib/gantt'
import { formatDateFull } from '@/lib/dates'
import type { GanttItem } from '@/lib/gantt'

type Props = {
  item: GanttItem
  left: number
  width: number
  rowHeight: number
}

const BAR_VERTICAL_PAD = 10

function TooltipContent({ item }: { item: GanttItem }) {
  return (
    <div className="space-y-1.5 min-w-[200px]">
      <div className="font-medium text-[#e8f4fd]">{item.title}</div>
      <div className="flex items-center gap-1.5">
        <div
          className="h-2 w-2 rounded-sm"
          style={{ backgroundColor: getCodeColor(item.code) }}
        />
        <span className="text-[#7aa3c8]">{item.code}</span>
        <span className="text-[#1e3a5f]">·</span>
        <span className="text-[#7aa3c8]">{item.status}</span>
        <span className="text-[#1e3a5f]">·</span>
        <span className="text-[#7aa3c8]">{Math.round(item.progress * 100)}%</span>
      </div>
      <div className="text-[#7aa3c8]">
        {formatDateFull(item.start)} → {formatDateFull(item.end)}
      </div>
      {item.assignees.length > 0 && (
        <div className="flex gap-1">
          {item.assignees.map((a) => (
            <div key={a.login} className="flex items-center gap-1">
              <Avatar src={a.avatarUrl} fallback={a.login} size={16} />
              <span className="text-[#7aa3c8]">{a.login}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GanttBar({ item, left, width, rowHeight }: Props) {
  const color = getCodeColor(item.code)
  const barHeight = rowHeight - BAR_VERTICAL_PAD * 2

  const style: CSSProperties = {
    position: 'absolute',
    left,
    top: BAR_VERTICAL_PAD,
    width: Math.max(width, 6),
    height: barHeight,
    borderRadius: 4,
    backgroundColor: `${color}33`,
    border: `1px solid ${color}66`,
    overflow: 'hidden',
    cursor: 'pointer',
  }

  const progressStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${item.progress * 100}%`,
    backgroundColor: color,
    opacity: 0.8,
    borderRadius: 4,
    transition: 'width 0.3s ease',
  }

  const labelStyle: CSSProperties = {
    position: 'absolute',
    left: 6,
    top: 0,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: '#e8f4fd',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: Math.max(width - 12, 0),
    zIndex: 1,
    pointerEvents: 'none',
  }

  return (
    <Tooltip content={<TooltipContent item={item} />} side="top">
      <div style={style}>
        <div style={progressStyle} />
        {width > 40 && (
          <span style={labelStyle}>
            #{item.issueNumber}
          </span>
        )}
      </div>
    </Tooltip>
  )
}
