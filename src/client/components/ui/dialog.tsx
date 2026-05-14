import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({
  children,
  className,
  title,
}: {
  children: ReactNode
  className?: string
  title: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#1e3a5f] bg-[#0d2040] p-6 shadow-2xl focus:outline-none',
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <DialogPrimitive.Title className="text-base font-semibold text-[#e8f4fd]">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="rounded-md p-1 text-[#7aa3c8] hover:bg-[#1e3a5f] hover:text-[#e8f4fd] transition-colors">
            <X size={16} />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
