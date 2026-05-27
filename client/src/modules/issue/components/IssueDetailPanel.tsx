import { useState } from 'react'
import { format } from 'date-fns'
import { X, MessageSquare, Activity, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/stores/uiStore'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import { useIssue } from '../hooks/useIssues'
import { useDeleteIssue } from '../hooks/useIssueMutations'
import { IssueProperties } from './IssueProperties'
import { IssueComments } from './IssueComments'
import { IssueActivity } from './IssueActivity'
import { IssueDescription } from './IssueDescription'
import type { Issue } from '@/shared/types/models'

function PanelSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-hover)]" />
      <div className="h-7 w-3/4 animate-pulse rounded bg-[var(--surface-hover)]" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-[var(--surface-hover)]" />
        ))}
      </div>
    </div>
  )
}

function PanelBody({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main — title + description + tabs */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <span className="mb-2 font-mono text-xs text-[var(--text-muted)]">
          {issue.identifier}
        </span>

        <h2 className="text-xl font-semibold leading-snug text-[var(--text-primary)]">
          {issue.title}
        </h2>

        <IssueDescription issue={issue} projectKey={projectKey} />

        {/* Tabs */}
        <div className="mt-8">
          <div className="flex gap-1 border-b border-[var(--border)]">
            {(['comments', 'activity'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium capitalize transition-colors',
                  tab === t
                    ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                )}
              >
                {t === 'comments' ? <MessageSquare size={12} /> : <Activity size={12} />}
                {t === 'comments' ? 'Comments' : 'Activity'}
              </button>
            ))}
          </div>
          <div className="py-4">
            {tab === 'comments' ? (
              <IssueComments projectKey={projectKey} identifier={issue.identifier} />
            ) : (
              <IssueActivity projectKey={projectKey} identifier={issue.identifier} />
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar — editable properties */}
      <div className="w-56 shrink-0 overflow-y-auto border-l border-[var(--border)] px-4 py-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Properties
        </p>

        <IssueProperties issue={issue} projectKey={projectKey} />

        {/* Created metadata (read-only) */}
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Created
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {format(new Date(issue.created_at), 'MMM d, yyyy')}
          </p>
          {issue.creator && (
            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
              by {issue.creator.full_name || issue.creator.email}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function IssueDetailPanel() {
  const { activeIssueId, setActiveIssueId } = useUiStore()
  const isOpen = !!activeIssueId

  const projectKey = activeIssueId?.replace(/-\d+$/, '') ?? ''
  const { data: issue, isLoading } = useIssue(projectKey, activeIssueId ?? '')

  const [confirmDelete, setConfirmDelete] = useState(false)
  const { mutate: deleteIssue, isPending: isDeleting } = useDeleteIssue(projectKey)

  const close = () => { setConfirmDelete(false); setActiveIssueId(null) }
  useKeyboardShortcut('Escape', close, { enabled: isOpen })

  function handleDelete() {
    if (!activeIssueId) return
    deleteIssue(activeIssueId, { onSuccess: close })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/10 transition-opacity duration-200',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={close}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-[700px] max-w-[90vw] flex-col',
          'border-l border-[var(--border)] bg-[var(--background)]',
          'shadow-2xl transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {activeIssueId ?? ''}
          </span>
          <div className="flex items-center gap-1">
            {confirmDelete ? (
              <>
                <span className="mr-1 text-xs text-[var(--text-muted)]">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-red-500"
                aria-label="Delete issue"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={close}
              className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        {isLoading || !issue
          ? <PanelSkeleton />
          : <PanelBody issue={issue} projectKey={projectKey} />
        }
      </div>
    </>
  )
}
