import { Skeleton } from '@/shared/components/ui/Skeleton'

export function IssueListSkeleton() {
  return (
    <div className="divide-y divide-[var(--border)]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex h-9 items-center gap-3 px-4">
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 flex-1 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="size-5 rounded-full" />
        </div>
      ))}
    </div>
  )
}
