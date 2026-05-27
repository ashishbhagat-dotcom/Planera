import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/shared/components/ui/Avatar'
import { useIssueActivity } from '../hooks/useIssueActivity'
import type { Activity } from '@/shared/types/models'

function verbSentence(activity: Activity): string {
  const { verb, data } = activity
  switch (verb) {
    case 'created':
      return 'created this issue'
    case 'moved':
      return `moved this from ${humanStatus(data.from as string)} to ${humanStatus(data.to as string)}`
    case 'assigned': {
      const to = data.to as string | null
      const from = data.from as string | null
      if (to && from) return `reassigned from ${from} to ${to}`
      if (to) return `assigned this to ${to}`
      return 'unassigned this issue'
    }
    case 'commented':
      return 'left a comment'
    case 'labelled': {
      const added = data.added as string[] | undefined
      const removed = data.removed as string[] | undefined
      const parts: string[] = []
      if (added?.length) parts.push(`added label ${added.join(', ')}`)
      if (removed?.length) parts.push(`removed label ${removed.join(', ')}`)
      return parts.join(' and ') || 'changed labels'
    }
    case 'updated': {
      const field = data.field as string | undefined
      if (field === 'title') return 'updated the title'
      if (field === 'description') return 'updated the description'
      if (field === 'priority')
        return `changed priority from ${data.from ?? '—'} to ${data.to ?? '—'}`
      if (field === 'due_date') return `set due date to ${data.to ?? 'none'}`
      if (field === 'estimate') return `set estimate to ${data.to ?? 'none'}`
      return 'updated this issue'
    }
    case 'deleted':
      return 'deleted this issue'
    default:
      return verb
  }
}

function humanStatus(status: string): string {
  return status?.replace(/_/g, ' ') ?? status
}

interface ActivityItemProps {
  activity: Activity
}

function ActivityItem({ activity }: ActivityItemProps) {
  const actor = activity.actor
  const name = actor?.full_name || actor?.email || 'Someone'

  return (
    <div className="flex gap-3">
      <div className="relative flex flex-col items-center">
        <Avatar src={actor?.avatar_url} name={name} size="sm" className="shrink-0" />
        {/* Connector line — hidden on last item via CSS in parent */}
        <div className="mt-1 w-px flex-1 bg-[var(--border)]" />
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
}

interface IssueActivityProps {
  projectKey: string
  identifier: string
}

export function IssueActivity({ projectKey, identifier }: IssueActivityProps) {
  const { data: activities = [], isLoading } = useIssueActivity(projectKey, identifier)

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-[var(--surface-hover)]" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-3 w-48 animate-pulse rounded bg-[var(--surface-hover)]" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-[var(--surface-hover)]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[var(--text-muted)]">No activity yet.</p>
    )
  }

  return (
    <div className="py-2">
      {activities.map((activity, idx) => (
        <div key={activity.id} className={idx === activities.length - 1 ? '[&_.connector]:hidden' : ''}>
          <ActivityItem activity={activity} />
        </div>
      ))}
    </div>
  )
}
