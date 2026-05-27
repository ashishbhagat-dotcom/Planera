import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/shared/components/ui/Avatar'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { Activity } from '@/shared/types/models'

function verbSentence(activity: Activity): string {
  const { verb, data } = activity
  const humanStatus = (s: unknown) => String(s ?? '').replace(/_/g, ' ')

  switch (verb) {
    case 'created': return 'created an issue'
    case 'moved':
      return `moved an issue from ${humanStatus(data.from)} to ${humanStatus(data.to)}`
    case 'assigned': {
      if (data.to && data.from) return 'reassigned an issue'
      if (data.to) return 'assigned an issue'
      return 'unassigned an issue'
    }
    case 'commented': return 'left a comment'
    case 'updated': return 'updated an issue'
    case 'deleted': return 'deleted an issue'
    default: return verb
  }
}

interface ActivityFeedProps {
  activities: Activity[] | undefined
  isLoading?: boolean
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities?.length) {
    return (
      <p className="py-6 text-center text-sm text-[var(--text-muted)]">
        No recent activity.
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => {
        const actor = activity.actor
        const name = actor?.full_name || actor?.email || 'Someone'
        const isLast = idx === activities.length - 1

        return (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Avatar src={actor?.avatar_url} name={name} size="sm" className="shrink-0" />
              {!isLast && <div className="mt-1 w-px flex-1 bg-[var(--border)]" />}
            </div>
            <div className="pb-5 pt-0.5">
              <p className="text-sm text-[var(--text-primary)]">
                <span className="font-medium">{name}</span>{' '}
                <span className="text-[var(--text-muted)]">{verbSentence(activity)}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
