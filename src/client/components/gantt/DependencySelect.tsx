import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

type Dep = { id: string; label: string }

type Props = {
  value: string[]
  availableDeps: Dep[]
  taskId: string
  onChange: (deps: string[]) => void
}

export default function DependencySelect({ value, availableDeps, taskId, onChange }: Props) {
  const selected = availableDeps.filter((d) => value.includes(d.id))
  const filtered = availableDeps.filter((d) => d.id !== taskId)

  function toggle(depId: string) {
    if (value.includes(depId)) {
      onChange(value.filter((id) => id !== depId))
    } else {
      onChange([...value, depId])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'w-full rounded border border-[#1e3a5f] bg-[#07172e] px-2 py-1.5 text-xs text-left transition-colors',
            'hover:border-[#4988C4] focus:outline-none focus:border-[#4988C4]',
            selected.length === 0 ? 'text-[#7aa3c8]' : 'text-[#e8f4fd]'
          )}
        >
          {selected.length === 0 ? (
            'None'
          ) : (
            <div className="flex flex-wrap gap-1">
              {selected.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center rounded-sm bg-[#1e3a5f] px-1.5 py-0.5 text-[10px] text-[#e8f4fd]"
                >
                  {d.label}
                </span>
              ))}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 min-w-[200px]" sideOffset={4}>
        <div className="max-h-48 overflow-auto">
          {filtered.map((dep) => {
            const isSelected = value.includes(dep.id)
            return (
              <button
                key={dep.id}
                onClick={() => toggle(dep.id)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-left text-[#e8f4fd] hover:bg-[#1e3a5f] transition-colors"
              >
                <Checkbox checked={isSelected} onCheckedChange={() => toggle(dep.id)} />
                <span className="truncate">{dep.label}</span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="px-2 py-4 text-xs text-center text-[#7aa3c8]">
              No other tasks available
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
