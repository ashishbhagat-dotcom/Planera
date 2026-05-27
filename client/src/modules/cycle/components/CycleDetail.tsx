import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useCycle } from '../hooks/useCycle'
import { CycleProgressBar } from './CycleProgressBar'
import { useIssues } from '@/modules/issue/hooks/useIssues'
import { IssueRow } from '@/modules/issue/components/IssueRow'
import { IssueListSkeleton } from '@/modules/issue/components/IssueListSkeleton'

export function CycleDetail() {
  const { key = '', cycleId = '' } = useParams<{ key: string; cycleId: string }>()
  const { data: cycle, isLoading: cycleLoading } = useCycle(key, cycleId)
  const { data: issues = [], isLoading: issuesLoading } = useIssues(key, { cycle: cycleId })

  if (cycleLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Cycle not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-3">
        <Link
          to={`/app/projects/${key}/cycles`}
          className="mb-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={12} />
          All cycles
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">{cycle.name}</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {cycle.start_date} → {cycle.end_date}
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded-full bg-[var(--surface-hover)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] capitalize">
            {cycle.status}
          </span>
        </div>
        <div className="mt-3 max-w-sm">
          <CycleProgressBar
            progress={cycle.progress}
            issueCounts={cycle.issue_counts_by_status}
          />
        </div>
      </div>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto">
        {issuesLoading ? (
          <IssueListSkeleton />
        ) : issues.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]">No issues in this cycle.</p>
          </div>
        ) : (
          <div>
            {issues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
