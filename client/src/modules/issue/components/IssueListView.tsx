import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutGrid, List, Plus, ListTodo } from 'lucide-react'
import { useIssues } from '../hooks/useIssues'
import { IssueRow } from './IssueRow'
import { CreateIssueModal } from './CreateIssueModal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useProject } from '@/modules/project/hooks/useProjects'
import { useUiStore } from '@/shared/stores/uiStore'
import { cn } from '@/shared/lib/utils'
import { IssueStatus } from '@/shared/types/enums'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.values(IssueStatus).map((s) => ({ value: s, label: s.replace('_', ' ') })),
]

function IssueListSkeleton() {
  return (
    <div className="divide-y divide-[var(--border)]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex h-9 items-center gap-3 px-4">
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 flex-1 rounded" />
          <Skeleton className="size-5 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function IssueListView() {
  const { key = '' } = useParams<{ key: string }>()
  const navigate = useNavigate()
  const { setBoardViewMode } = useUiStore()
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: project } = useProject(key)
  const { data: issues = [], isLoading } = useIssues(key, {
    status: statusFilter || undefined,
  })

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {project?.name ?? key} — Issues
          </h2>
          <span className="rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
            {issues.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus size={13} />
            New issue
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-[var(--border)]">
            <button
              onClick={() => { setBoardViewMode('kanban'); navigate(`/app/projects/${key}/board`) }}
              className="rounded-l-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)]"
              title="Kanban view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={cn('rounded-r-md p-1.5 transition-colors', 'bg-[var(--accent)] text-white')}
              title="List view"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid h-8 shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-medium text-[var(--text-muted)]"
        style={{ gridTemplateColumns: '16px 16px 80px 1fr 160px 120px 24px', gap: '12px' }}
      >
        <span /> {/* priority */}
        <span /> {/* status */}
        <span>ID</span>
        <span>Title</span>
        <span>Labels</span>
        <span>Due</span>
        <span className="text-center">@</span>
      </div>

      {/* Issue rows */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <IssueListSkeleton />
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)]">
              <ListTodo size={24} />
            </div>
            <h3 className="mt-4 font-semibold text-[var(--text-primary)]">No issues found</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {statusFilter ? 'Try changing the status filter.' : 'Create your first issue to get started.'}
            </p>
            {!statusFilter && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Plus size={15} />
                Create issue
              </button>
            )}
          </div>
        ) : (
          issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))
        )}
      </div>

      {showCreate && (
        <CreateIssueModal
          projectKey={key}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
