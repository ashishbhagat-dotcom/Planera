import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertCircle, ArrowDown, ArrowUp, Minus, MoreHorizontal,
  MoreVertical, Trash2,
} from 'lucide-react'
import { DropdownMenu } from '@/shared/components/ui/DropdownMenu'
import { Avatar } from '@/shared/components/ui/Avatar'
import { RoleGuard } from '@/shared/components/ui/RoleGuard'
import { cn } from '@/shared/lib/utils'
import type { Issue } from '@/shared/types/models'
import { IssuePriority, MemberRole } from '@/shared/types/enums'
import { useDeleteIssue } from '@/modules/issue/hooks/useIssueMutations'
import { useUiStore } from '@/shared/stores/uiStore'

const PRIORITY_ICON: Record<IssuePriority, React.ReactNode> = {
  [IssuePriority.URGENT]: <AlertCircle size={12} className="text-red-500" />,
  [IssuePriority.HIGH]:   <ArrowUp size={12} className="text-orange-400" />,
  [IssuePriority.MEDIUM]: <Minus size={12} className="text-yellow-400" />,
  [IssuePriority.LOW]:    <ArrowDown size={12} className="text-blue-400" />,
  [IssuePriority.NONE]:   <MoreHorizontal size={12} className="text-[var(--text-muted)]" />,
}

// Shared visual content — no dnd hooks
function CardContent({ issue, projectKey, onDelete }: {
  issue: Issue
  projectKey: string
  onDelete: () => void
}) {
  return (
    <>
      {/* Top row: priority + identifier + menu */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span>{PRIORITY_ICON[issue.priority as IssuePriority] ?? PRIORITY_ICON[IssuePriority.NONE]}</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">{issue.identifier}</span>
        </div>

        <RoleGuard roles={[MemberRole.OWNER, MemberRole.ADMIN]}>
          <DropdownMenu>
            <DropdownMenu.Trigger className="cursor-pointer rounded p-0.5 opacity-0 transition-opacity hover:bg-[var(--surface-hover)] group-hover:opacity-100">
              <MoreVertical size={13} className="text-[var(--text-muted)]" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="right">
              <DropdownMenu.Item destructive onClick={onDelete}>
                <Trash2 size={13} />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </RoleGuard>
      </div>

      {/* Title */}
      <p className="mb-2 line-clamp-2 text-[13px] leading-snug text-[var(--text-primary)]">
        {issue.title}
      </p>

      {/* Labels */}
      {issue.labels?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: assignee */}
      <div className="flex items-center justify-end">
        {issue.assignee ? (
          <Avatar
            src={issue.assignee.avatar_url}
            name={issue.assignee.full_name || issue.assignee.email}
            size="sm"
          />
        ) : (
          <div className="size-5 rounded-full border border-dashed border-[var(--border)]" />
        )}
      </div>
    </>
  )
}

// Sortable card — used inside SortableContext columns
export function BoardCard({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id })
  const deleteIssue = useDeleteIssue(projectKey)
  const setActiveIssueId = useUiStore((s) => s.setActiveIssueId)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative cursor-grab rounded-md border border-[var(--border)] bg-[var(--surface)]',
        'p-3 text-sm transition-shadow hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] hover:shadow-sm',
        isDragging && 'opacity-30',
      )}
      onClick={() => setActiveIssueId(issue.identifier)}
    >
      <CardContent
        issue={issue}
        projectKey={projectKey}
        onDelete={() => deleteIssue.mutate(issue.identifier)}
      />
    </div>
  )
}

// Overlay card — rendered inside DragOverlay, no dnd hooks
export function BoardCardOverlay({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const deleteIssue = useDeleteIssue(projectKey)

  return (
    <div
      className="group relative cursor-grabbing rounded-md border border-[var(--accent)]/30 bg-[var(--surface)] p-3 text-sm opacity-95 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      style={{ transform: 'rotate(2deg)' }}
    >
      <CardContent
        issue={issue}
        projectKey={projectKey}
        onDelete={() => deleteIssue.mutate(issue.identifier)}
      />
    </div>
  )
}
