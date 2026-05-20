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

function MilestoneDiamond({
  offset,
  label,
}: {
  offset: number
  label: string
}) {
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 z-20 group"
      style={{ left: offset - 6 }}
    >
      <div
        className="h-3 w-3 rotate-45 border border-[#64CCC5] bg-[#64CCC5]"
        style={{ opacity: 0.4 }}
      />
      <div className="absolute left-1/2 -translate-x-1/2 top-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30 bg-[#0d2040] border border-[#1e3a5f] rounded px-2 py-1 text-[10px] text-[#64CCC5] font-medium pointer-events-none">
        {label}
      </div>
    </div>
  )
}

function GanttTimeline({
  chartStart,
  chartEnd,
  totalWidth,
  todayOffset,
  milestones,
}: {
  chartStart: Date
  chartEnd: Date
  totalWidth: number
  todayOffset: number | null
  milestones: { title: string; date: Date }[]
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

          {/* Milestone diamonds in header */}
          {milestones.map((m) => {
            const offset = daysBetween(chartStart, m.date) * DAY_WIDTH
            if (offset < 0 || offset > totalWidth) return null
            return (
              <MilestoneDiamond key={m.title} offset={offset} label={m.title} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function GanttChart({ items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const milestones = useMemo(() => {
    const map = new Map<string, Date>()
    for (const item of items) {
      if (item.milestone?.dueOn && !map.has(item.milestone.title)) {
        map.set(item.milestone.title, startOfDay(new Date(item.milestone.dueOn)))
      }
    }
    return Array.from(map.entries()).map(([title, date]) => ({ title, date })).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [items])

  const { chartStart, chartEnd, totalWidth, todayOffset } = useMemo(() => {
    const today = startOfDay(new Date())
    const endOfYear = new Date(today.getFullYear(), 11, 31)

    if (items.length === 0) {
      const start = addDays(today, -7)
      const end = new Date(Math.max(addDays(today, 60).getTime(), endOfYear.getTime()))
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
    const end = new Date(Math.max(addDays(startOfDay(maxEnd), 7).getTime(), endOfYear.getTime()))
    const total = daysBetween(start, end) * DAY_WIDTH
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
              milestones={milestones}
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

              {/* Milestone vertical dashed lines through rows */}
              {milestones.map((m) => {
                const offset = daysBetween(chartStart, m.date) * DAY_WIDTH
                if (offset < 0 || offset > totalWidth) return null
                return (
                  <div
                    key={m.title}
                    className="absolute top-0 bottom-0 z-10 pointer-events-none"
                    style={{
                      left: SIDEBAR_WIDTH + offset,
                      width: 1,
                      borderLeft: '1px dashed #64CCC5',
                      opacity: 0.3,
                    }}
                  />
                )
              })}

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
