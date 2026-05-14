import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type ReactNode } from 'react'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={200}>{children}</TooltipPrimitive.Provider>
}

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-[#1e3a5f] bg-[#07172e] px-3 py-2 text-xs text-[#e8f4fd] shadow-xl"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[#07172e]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
