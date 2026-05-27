import { GitBranch, UserMinus, Bell } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Notification } from '@/shared/types/models'

function typeIcon(type: string) {
  if (type === 'issue.assigned') return <GitBranch size={14} />
  if (type === 'issue.unassigned') return <UserMinus size={14} />
  return <Bell size={14} />
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  notification: Notification
}

export function NotificationItem({ notification }: Props) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]',
        !notification.is_read && 'bg-[var(--surface-hover)]/40',
      )}
    >
      <span className="mt-0.5 shrink-0 text-[var(--text-muted)]">
        {typeIcon(notification.type)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--text-primary)] leading-snug">{notification.title}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          {relativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  )
}
