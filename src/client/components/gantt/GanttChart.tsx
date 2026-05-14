import { useRef, useMemo } from 'react'
import GanttRow from './GanttRow'
import { TooltipProvider } from '@/components/ui/tooltip'
import { daysBetween, addDays, startOfDay, getMonthSpans, eachWeekStart, formatDate } from '@/lib/dates'
import type { GanttItem } from '@/lib/gantt'

const SIDEBAR_WIDTH = 260
const ROW_HEIGHT = 48
const HEADER_HEIGHT = 56
const DAY_WIDTH = 28

type Props = {
  items: GanttItem[]
}

function GanttTimeline({
  chartStart,
  chartEnd,
  totalWidth,
  todayOffset,
}: {
  chartStart: Date
  chartEnd: Date
  totalWidth: number
  todayOffset: number | null
}) {
  const monthSpans = useMemo(
    () => getMonthSpans(chartStart, chartEnd, DAY_WIDTH),
    [chartStart, chartEnd]
  )

  const weeks = useMemo(
    () => eachWeekStart(chartStart, chartEnd),
    [chartStart, chartEnd]
  )

  return (
    <div
      className="sticky top-0 z-20 border-b border-[#1e3a5f] bg-[#0d2040]"
      style={{ width: SIDEBAR_WIDTH + totalWidth, height: HEADER_HEIGHT }}
    >
      <div className="flex" style={{ height: HEADER_HEIGHT }}>
        <div
          className="sticky left-0 z-30 flex shrink-0 items-end pb-1 px-3 border-r border-[#1e3a5f] bg-[#0d2040]"
          style={{ width: SIDEBAR_WIDTH, height: HEADER_HEIGHT }}
        >
          <span className="text-xs font-medium text-[#7aa3c8]">Task</span>
        </div>

        <div className="relative" style={{ width: totalWidth, height: HEADER_HEIGHT }}>
          {/* Month labels */}
          <div className="flex" style={{ height: 26 }}>
            {monthSpans.map((span) => (
              <div
                key={`${span.label}-${span.startOffset}`}
                className="overflow-hidden border-r border-[#1e3a5f] px-2 flex items-center"
                style={{ width: span.days * DAY_WIDTH, height: 26 }}
              >
                <span className="text-xs font-medium text-[#7aa3c8] whitespace-nowrap">
                  {span.label}
                </span>
              </div>
            ))}
          </div>

          {/* Week labels */}
          <div className="relative" style={{ height: 30 }}>
            {weeks.map((week) => {
              const offset = Math.max(0, daysBetween(chartStart, week)) * DAY_WIDTH
              if (offset > totalWidth) return null
              return (
                <div
                  key={week.toISOString()}
                  className="absolute top-0 flex items-center justify-start px-1"
                  style={{ left: offset, width: 7 * DAY_WIDTH, height: 30 }}
                >
                  <span className="text-[10px] text-[#4988C4] whitespace-nowrap">
                    {formatDate(week)}
                  </span>
                </div>
              )
            })}
            {/* Vertical week lines */}
            {weeks.map((week) => {
              const offset = Math.max(0, daysBetween(chartStart, week)) * DAY_WIDTH
              if (offset > totalWidth || offset < 0) return null
              return (
                <div
                  key={`line-${week.toISOString()}`}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: offset,
                    width: 1,
                    backgroundColor: '#1e3a5f',
                  }}
                />
              )
            })}
          </div>

          {/* Today indicator */}
          {todayOffset !== null && todayOffset >= 0 && todayOffset <= totalWidth && (
            <div
              className="absolute top-0 z-10"
              style={{
                left: todayOffset,
                width: 2,
                height: HEADER_HEIGHT,
                backgroundColor: '#BDE8F5',
                opacity: 0.6,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function GanttChart({ items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { chartStart, chartEnd, totalWidth, todayOffset } = useMemo(() => {
    if (items.length === 0) {
      const today = new Date()
      const start = addDays(today, -7)
      const end = addDays(today, 60)
      return {
        chartStart: startOfDay(start),
        chartEnd: startOfDay(end),
        totalWidth: daysBetween(start, end) * DAY_WIDTH,
        todayOffset: 7 * DAY_WIDTH,
      }
    }

    const minStart = new Date(Math.min(...items.map((i) => i.start.getTime())))
    const maxEnd = new Date(Math.max(...items.map((i) => i.end.getTime())))
    const start = addDays(startOfDay(minStart), -7)
    const end = addDays(startOfDay(maxEnd), 7)
    const total = daysBetween(start, end) * DAY_WIDTH
    const today = startOfDay(new Date())
    const todayOff = daysBetween(start, today) * DAY_WIDTH

    return { chartStart: start, chartEnd: end, totalWidth: total, todayOffset: todayOff }
  }, [items])

  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-[#7aa3c8] text-sm">
        No items to display. Try adjusting the filters.
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
        <div ref={scrollRef} className="overflow-auto flex-1">
          <div style={{ width: SIDEBAR_WIDTH + totalWidth, minWidth: '100%' }}>
            <GanttTimeline
              chartStart={chartStart}
              chartEnd={chartEnd}
              totalWidth={totalWidth}
              todayOffset={todayOffset}
            />

            {/* Today vertical line through rows */}
            <div className="relative">
              {todayOffset !== null && todayOffset >= 0 && todayOffset <= totalWidth && (
                <div
                  className="absolute top-0 bottom-0 z-10 pointer-events-none"
                  style={{
                    left: SIDEBAR_WIDTH + todayOffset,
                    width: 2,
                    backgroundColor: '#BDE8F5',
                    opacity: 0.25,
                  }}
                />
              )}

              {items.map((item, idx) => (
                <GanttRow
                  key={item.id}
                  item={item}
                  chartStart={chartStart}
                  dayWidth={DAY_WIDTH}
                  rowHeight={ROW_HEIGHT}
                  totalWidth={totalWidth}
                  sidebarWidth={SIDEBAR_WIDTH}
                  isEven={idx % 2 === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
