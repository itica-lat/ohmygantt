import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'ghost' | 'outline' | 'destructive'
type Size = 'sm' | 'md' | 'lg' | 'icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const variants: Record<Variant, string> = {
  default: 'bg-[#4988C4] text-white hover:bg-[#1C4D8D] active:bg-[#0F2854]',
  ghost: 'bg-transparent hover:bg-[#0d2040] text-[#e8f4fd]',
  outline: 'border border-[#1e3a5f] bg-transparent hover:bg-[#0d2040] text-[#e8f4fd]',
  destructive: 'bg-red-700 text-white hover:bg-red-800',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9',
}

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4988C4] disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
