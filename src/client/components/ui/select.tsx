import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Select({
  value,
  onValueChange,
  children,
  placeholder = 'Select...',
  className,
}: {
  value?: string
  onValueChange?: (v: string) => void
  children: ReactNode
  placeholder?: string
  className?: string
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex h-9 items-center justify-between gap-2 rounded-md border border-[#1e3a5f] bg-[#0d2040] px-3 text-sm text-[#e8f4fd] transition-colors hover:bg-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#4988C4] min-w-[120px]',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={14} className="text-[#7aa3c8]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-50 min-w-[160px] overflow-hidden rounded-md border border-[#1e3a5f] bg-[#0d2040] shadow-xl"
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-3 text-sm text-[#e8f4fd] outline-none hover:bg-[#1e3a5f] focus:bg-[#1e3a5f] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={12} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
