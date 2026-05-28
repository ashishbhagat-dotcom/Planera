import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useSelectionStore } from '@/shared/stores/selectionStore'
import { useBulkUpdate } from '@/modules/issue/hooks/useIssueMutations'
import { useMembers } from '@/modules/workspace/hooks/useMembers'
import { IssueStatus, IssuePriority } from '@/shared/types/enums'

const STATUS_OPTIONS = [
  { value: IssueStatus.BACKLOG,     label: 'Backlog' },
  { value: IssueStatus.TODO,        label: 'Todo' },
  { value: IssueStatus.IN_PROGRESS, label: 'In Progress' },
  { value: IssueStatus.IN_REVIEW,   label: 'In Review' },
  { value: IssueStatus.DONE,        label: 'Done' },
  { value: IssueStatus.CANCELLED,   label: 'Cancelled' },
]

const PRIORITY_OPTIONS = [
  { value: IssuePriority.URGENT, label: 'Urgent' },
  { value: IssuePriority.HIGH,   label: 'High' },
  { value: IssuePriority.MEDIUM, label: 'Medium' },
  { value: IssuePriority.LOW,    label: 'Low' },
  { value: IssuePriority.NONE,   label: 'No priority' },
]

export function BulkActionBar() {
  const { selectedIds, clear } = useSelectionStore()
  const bulkUpdate = useBulkUpdate()
  const { data: members = [] } = useMembers()
  const count = selectedIds.size

  function apply(changes: Record<string, unknown>) {
    bulkUpdate.mutate(
      { identifiers: [...selectedIds], changes },
      { onSuccess: clear },
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-1/2 z-50 -translate-x-1/2 transition-transform duration-200',
        count > 0 ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 shadow-2xl">
        <span className="mr-1 shrink-0 text-sm font-medium text-[var(--text-primary)]">
          {count} selected
        </span>

        <select
          className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
          defaultValue=""
          onChange={(e) => { if (e.target.value) { apply({ status: e.target.value }); e.target.value = '' } }}
        >
          <option value="" disabled>Status</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
          defaultValue=""
          onChange={(e) => { if (e.target.value) { apply({ priority: e.target.value }); e.target.value = '' } }}
        >
          <option value="" disabled>Priority</option>
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              apply({ assignee_id: e.target.value === 'null' ? null : e.target.value })
              e.target.value = ''
            }
          }}
        >
          <option value="" disabled>Assignee</option>
          <option value="null">Unassign</option>
          {members.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              {m.user.full_name || m.user.email}
            </option>
          ))}
        </select>

        <div className="mx-1 h-4 w-px bg-[var(--border)]" />

        <button
          onClick={clear}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          <X size={12} />
          Clear
        </button>
      </div>
    </div>
  )
}
