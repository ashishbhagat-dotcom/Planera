import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutGrid, List, Plus, ListTodo, RefreshCw } from 'lucide-react'
import { useIssues } from '../hooks/useIssues'
import { IssueRow } from './IssueRow'
import { IssueListSkeleton } from './IssueListSkeleton'
import { CreateIssueModal } from './CreateIssueModal'
import { EmptyState } from '@/shared/components/data/EmptyState'
import { RoleGuard } from '@/shared/components/ui/RoleGuard'
import { useProject } from '@/modules/project/hooks/useProjects'
import { useUiStore } from '@/shared/stores/uiStore'
import { cn } from '@/shared/lib/utils'
import { IssueStatus, MemberRole } from '@/shared/types/enums'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.values(IssueStatus).map((s) => ({ value: s, label: s.replace('_', ' ') })),
]


export function IssueListView() {
  const { key = '' } = useParams<{ key: string }>()
  const navigate = useNavigate()
  const { setBoardViewMode } = useUiStore()
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: project } = useProject(key)
  const { data: issues = [], isLoading, isError, refetch } = useIssues(key, {
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
        ) : isError ? (
          <EmptyState
            icon={<RefreshCw size={24} />}
            title="Failed to load issues"
            description="Something went wrong. Check your connection and try again."
            action={
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            }
          />
        ) : issues.length === 0 ? (
          <EmptyState
            icon={<ListTodo size={24} />}
            title="No issues found"
            description={
              statusFilter
                ? 'Try changing the status filter.'
                : 'Create your first issue to get started.'
            }
            action={
              !statusFilter ? (
                <RoleGuard roles={[MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]}>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <Plus size={15} />
                    Create issue
                  </button>
                </RoleGuard>
              ) : undefined
            }
          />
        ) : (
          issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              allIds={issues.map((i) => i.identifier)}
            />
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
