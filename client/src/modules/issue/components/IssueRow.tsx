import {
  AlertCircle, ArrowUp, ArrowDown, Minus, MoreHorizontal,
  Circle, CircleDot, Timer, Eye, CheckCircle2, XCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Issue } from '@/shared/types/models'
import { IssueStatus, IssuePriority } from '@/shared/types/enums'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/stores/uiStore'

// --- Status indicator ---
const STATUS_ICON: Record<IssueStatus, React.ReactNode> = {
  [IssueStatus.BACKLOG]:     <Circle size={14} className="text-[var(--text-muted)]" />,
  [IssueStatus.TODO]:        <CircleDot size={14} className="text-gray-400" />,
  [IssueStatus.IN_PROGRESS]: <Timer size={14} className="text-amber-400" />,
  [IssueStatus.IN_REVIEW]:   <Eye size={14} className="text-blue-400" />,
  [IssueStatus.DONE]:        <CheckCircle2 size={14} className="text-emerald-500" />,
  [IssueStatus.CANCELLED]:   <XCircle size={14} className="text-red-400" />,
}

// --- Priority indicator ---
const PRIORITY_ICON: Record<IssuePriority, React.ReactNode> = {
  [IssuePriority.URGENT]: <AlertCircle size={14} className="text-red-500" />,
  [IssuePriority.HIGH]:   <ArrowUp size={14} className="text-orange-400" />,
  [IssuePriority.MEDIUM]: <Minus size={14} className="text-yellow-400" />,
  [IssuePriority.LOW]:    <ArrowDown size={14} className="text-blue-400" />,
  [IssuePriority.NONE]:   <MoreHorizontal size={14} className="text-[var(--text-muted)]" />,
}

function AssigneeAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="size-5 rounded-full object-cover" />
  }
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

interface Props {
  issue: Issue
  onClick?: () => void
}

export function IssueRow({ issue, onClick }: Props) {
  const setActiveIssueId = useUiStore((s) => s.setActiveIssueId)
  return (
    <button
      onClick={() => { setActiveIssueId(issue.identifier); onClick?.() }}
      className={cn(
        'group grid h-9 w-full items-center border-b border-[var(--border)] px-4',
        'text-left transition-colors hover:bg-[var(--surface-hover)]',
      )}
      style={{ gridTemplateColumns: '16px 16px 80px 1fr 160px 120px 24px', gap: '12px' }}
    >
      {/* Priority */}
      <span className="flex items-center">
        {PRIORITY_ICON[issue.priority as IssuePriority] ?? PRIORITY_ICON[IssuePriority.NONE]}
      </span>

      {/* Status */}
      <span className="flex items-center">
        {STATUS_ICON[issue.status as IssueStatus] ?? STATUS_ICON[IssueStatus.BACKLOG]}
      </span>

      {/* Identifier */}
      <span className="font-mono text-xs text-[var(--text-muted)]">
        {issue.identifier}
      </span>

      {/* Title */}
      <span className="truncate text-sm text-[var(--text-primary)]">
        {issue.title}
      </span>

      {/* Labels */}
      <span className="flex items-center gap-1 overflow-hidden">
        {issue.labels?.slice(0, 2).map((label) => (
          <span
            key={label.id}
            className="truncate rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
          </span>
        ))}
      </span>

      {/* Due date */}
      <span className="truncate text-xs text-[var(--text-muted)]">
        {issue.due_date
          ? formatDistanceToNow(new Date(issue.due_date), { addSuffix: true })
          : ''}
      </span>

      {/* Assignee */}
      <span className="flex items-center">
        {issue.assignee ? (
          <AssigneeAvatar
            name={issue.assignee.full_name || issue.assignee.email}
            avatarUrl={issue.assignee.avatar_url}
          />
        ) : (
          <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-[var(--border)]" />
        )}
      </span>
    </button>
  )
}
