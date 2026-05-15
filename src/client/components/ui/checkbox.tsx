import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Checkbox({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
}) {
  return (
    <CheckboxPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-[#1e3a5f] bg-[#07172e] transition-colors',
        'hover:border-[#4988C4]',
        'data-[state=checked]:border-[#4988C4] data-[state=checked]:bg-[#4988C4]'
      )}
    >
      <CheckboxPrimitive.Indicator>
        <Check size={10} className="text-white" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
