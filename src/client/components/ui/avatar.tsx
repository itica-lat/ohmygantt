import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

export function Avatar({
  src,
  fallback,
  className,
  size = 24,
}: {
  src?: string
  fallback: string
  className?: string
  size?: number
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
        className
      )}
      style={{ width: size, height: size }}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={fallback}
          className="h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-[#1e3a5f] text-[#7aa3c8] text-xs font-medium"
        delayMs={300}
      >
        {fallback.slice(0, 2).toUpperCase()}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
