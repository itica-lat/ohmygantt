import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCodeColor, STATUS_LIST } from '@/lib/gantt'
import type { ItemFilters } from '@/hooks/useItems'

type Props = {
  availableCodes: string[]
  availableAssignees: string[]
  availableIterations: string[]
  filters: ItemFilters
  onChange: (filters: ItemFilters) => void
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

export default function GanttFilters({ availableCodes, availableAssignees, availableIterations, filters, onChange }: Props) {
  const hasFilters =
    filters.codes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.assignees.length > 0 ||
    filters.iterations.length > 0

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#1e3a5f] bg-[#07172e] px-5 py-2.5">
      {availableCodes.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#7aa3c8]">Area</span>
          <div className="flex gap-1">
            {availableCodes.map((code) => (
              <button
                key={code}
                onClick={() => onChange({ ...filters, codes: toggle(filters.codes, code) })}
                className="rounded-sm px-2 py-0.5 text-xs font-mono font-medium transition-opacity"
                style={{
                  backgroundColor: getCodeColor(code),
                  opacity: filters.codes.length === 0 || filters.codes.includes(code) ? 1 : 0.3,
                  color: '#07172e',
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#7aa3c8]">Status</span>
        <div className="flex gap-1">
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, s) })}
              className={`rounded-sm px-2 py-0.5 text-xs font-medium transition-colors ${
                filters.statuses.length === 0 || filters.statuses.includes(s)
                  ? 'bg-[#1e3a5f] text-[#e8f4fd]'
                  : 'bg-[#0d2040] text-[#7aa3c8]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {availableAssignees.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#7aa3c8]">Assignee</span>
          <div className="flex gap-1">
            {availableAssignees.map((a) => (
              <button
                key={a}
                onClick={() => onChange({ ...filters, assignees: toggle(filters.assignees, a) })}
                className={`rounded-sm px-2 py-0.5 text-xs font-medium transition-colors ${
                  filters.assignees.length === 0 || filters.assignees.includes(a)
                    ? 'bg-[#1e3a5f] text-[#e8f4fd]'
                    : 'bg-[#0d2040] text-[#7aa3c8]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableIterations.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#7aa3c8]">Iteration</span>
          <div className="flex gap-1">
            {availableIterations.map((it) => (
              <button
                key={it}
                onClick={() => onChange({ ...filters, iterations: toggle(filters.iterations, it) })}
                className={`rounded-sm px-2 py-0.5 text-xs font-medium transition-colors ${
                  filters.iterations.length === 0 || filters.iterations.includes(it)
                    ? 'bg-[#1e3a5f] text-[#e8f4fd]'
                    : 'bg-[#0d2040] text-[#7aa3c8]'
                }`}
              >
                {it}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs text-[#7aa3c8]"
          onClick={() => onChange({ codes: [], statuses: [], assignees: [], iterations: [] })}
        >
          <X size={11} />
          Clear
        </Button>
      )}

      <div className="ml-auto flex gap-2">
        {Object.entries({ IS: '#4988C4', UTU: '#64CCC5', FS: '#7B68EE', ASO: '#F4A261' }).map(
          ([code, color]) => (
            <div key={code} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-[#7aa3c8]">{code}</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
