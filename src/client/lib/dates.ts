export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' }).format(date)
}

export function formatDateFull(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

export function formatShortMonth(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function eachWeekStart(start: Date, end: Date): Date[] {
  const weeks: Date[] = []
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - ((day + 6) % 7))
  while (d <= end) {
    weeks.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return weeks
}

export type MonthSpan = { label: string; days: number; startOffset: number }

export function getMonthSpans(start: Date, end: Date, dayWidth: number): MonthSpan[] {
  const spans: MonthSpan[] = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  let offset = 0

  while (current <= end) {
    const month = current.getMonth()
    const year = current.getFullYear()
    let days = 0
    const spanStart = offset

    while (current.getMonth() === month && current.getFullYear() === year && current <= end) {
      days++
      current.setDate(current.getDate() + 1)
    }

    spans.push({
      label: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
        new Date(year, month, 1)
      ),
      days,
      startOffset: spanStart * dayWidth,
    })
    offset += days
  }

  return spans
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}
