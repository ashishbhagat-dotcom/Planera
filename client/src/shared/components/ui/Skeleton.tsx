import { cn } from '@/shared/lib/utils'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[--surface-hover]',
        className
      )}
    />
  )
}

export { Skeleton }
