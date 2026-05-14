import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'outline' | 'code'

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant
  style?: React.CSSProperties
}

const variants: Record<Variant, string> = {
  default: 'bg-[#1e3a5f] text-[#e8f4fd]',
  outline: 'border border-[#1e3a5f] text-[#7aa3c8]',
  code: 'font-mono text-xs',
}

export function Badge({ className, variant = 'default', children, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
