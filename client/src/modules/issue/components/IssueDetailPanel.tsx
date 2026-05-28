import { useState } from 'react'
import { format } from 'date-fns'
import { X, MessageSquare, Activity, Trash2, Plus, Circle, CircleDot, Timer, Eye, CheckCircle2, XCircle } from 'lucide-react'
import { FavoriteButton } from '@/modules/favorites'
import { AIAssistButton, useAISuggest } from '@/modules/ai'
import { AIResultPanel } from '@/modules/ai/components/AIResultPanel'
import type { AIAction, AIResult } from '@/modules/ai'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/stores/uiStore'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import { useIssue } from '../hooks/useIssues'
import { useDeleteIssue, useUpdateIssue, useCreateIssue } from '../hooks/useIssueMutations'
import { IssueProperties } from './IssueProperties'
import { IssueComments } from './IssueComments'
import { IssueActivity } from './IssueActivity'
import { IssueDescription } from './IssueDescription'
import { CreateIssueModal } from './CreateIssueModal'
import { RoleGuard } from '@/shared/components/ui/RoleGuard'
import { MemberRole } from '@/shared/types/enums'
import type { Issue } from '@/shared/types/models'

const SUB_STATUS_ICON: Record<string, React.ReactNode> = {
  backlog:     <Circle size={12} className="text-[var(--text-muted)]" />,
  todo:        <CircleDot size={12} className="text-gray-400" />,
  in_progress: <Timer size={12} className="text-amber-400" />,
  in_review:   <Eye size={12} className="text-blue-400" />,
  done:        <CheckCircle2 size={12} className="text-emerald-500" />,
  cancelled:   <XCircle size={12} className="text-red-400" />,
}

function SubIssueRow({ sub, onClick }: { sub: NonNullable<Issue['sub_issues']>[number]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
    >
      <span className="shrink-0">{SUB_STATUS_ICON[sub.status] ?? SUB_STATUS_ICON.backlog}</span>
      <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">{sub.identifier}</span>
      <span className="truncate text-xs text-[var(--text-primary)]">{sub.title}</span>
    </button>
  )
}

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
  const [showAddSubIssue, setShowAddSubIssue] = useState(false)
  const [activeAction, setActiveAction] = useState<AIAction | null>(null)
  const setActiveIssueId = useUiStore((s) => s.setActiveIssueId)
  const { mutate: updateIssue } = useUpdateIssue(projectKey, issue.identifier)
  const { mutate: createSubIssue } = useCreateIssue(projectKey)
  const { mutate: aiSuggest, data: aiResult, isPending: aiPending, error: aiError, reset: aiReset } = useAISuggest()

  function handleAISelectAction(action: AIAction) {
    setActiveAction(action)
    aiReset()
    aiSuggest({ action, context: { title: issue.title, description: issue.description ?? undefined } })
  }

  function handleAIApply(result: AIResult) {
    if (activeAction === 'improve_description' && typeof result === 'string') {
      updateIssue({ description: result })
    } else if (activeAction === 'generate_subtasks' && Array.isArray(result)) {
      (result as string[]).forEach((title) => createSubIssue({ title, parent_id: issue.id }))
    } else if (activeAction === 'estimate_effort' && typeof result === 'object' && !Array.isArray(result)) {
      const r = result as { story_points: number; priority: string }
      updateIssue({ estimate: r.story_points, priority: r.priority })
    }
    setActiveAction(null)
    aiReset()
  }

  function handleAIDiscard() {
    setActiveAction(null)
    aiReset()
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main — title + description + tabs */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {issue.identifier}
          </span>
          <AIAssistButton onSelectAction={handleAISelectAction} isPending={aiPending} />
        </div>

        {(aiPending || aiResult || aiError) && activeAction && (
          <div className="mb-4">
            <AIResultPanel
              action={activeAction}
              result={aiResult ?? null}
              isLoading={aiPending}
              error={aiError}
              onApply={handleAIApply}
              onDiscard={handleAIDiscard}
            />
          </div>
        )}

        {issue.parent && (
          <button
            onClick={() => setActiveIssueId(issue.parent!.identifier)}
            className="mb-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <span className="shrink-0">{SUB_STATUS_ICON[issue.parent.status] ?? SUB_STATUS_ICON.backlog}</span>
            <span className="font-mono">{issue.parent.identifier}</span>
            <span className="truncate">{issue.parent.title}</span>
          </button>
        )}

        <h2 className="text-xl font-semibold leading-snug text-[var(--text-primary)]">
          {issue.title}
        </h2>

        <IssueDescription issue={issue} projectKey={projectKey} />

        {/* Sub-issues */}
        {!issue.parent_id && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Sub-issues
                {(issue.sub_issue_count ?? 0) > 0 && (
                  <span className="ml-1.5 font-mono font-normal">
                    {issue.completed_sub_issue_count ?? 0}/{issue.sub_issue_count}
                  </span>
                )}
              </p>
              <button
                onClick={() => setShowAddSubIssue(true)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              >
                <Plus size={11} />
                Add
              </button>
            </div>
            {issue.sub_issues && issue.sub_issues.length > 0 ? (
              <div className="space-y-0.5">
                {issue.sub_issues.map((sub) => (
                  <SubIssueRow
                    key={sub.id}
                    sub={sub}
                    onClick={() => setActiveIssueId(sub.identifier)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No sub-issues yet.</p>
            )}
          </div>
        )}

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

      {showAddSubIssue && (
        <CreateIssueModal
          projectKey={projectKey}
          parentId={issue.id}
          parentIdentifier={issue.identifier}
          onClose={() => setShowAddSubIssue(false)}
        />
      )}

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
            {issue && (
              <FavoriteButton targetType="issue" targetId={issue.id} />
            )}
            <RoleGuard roles={[MemberRole.OWNER, MemberRole.ADMIN]}>
              {confirmDelete ? (
                <>
                  <span className="mr-1 text-xs text-[var(--text-muted)]">
                    {(issue?.sub_issue_count ?? 0) > 0
                      ? `Delete + ${issue!.sub_issue_count} sub-issues?`
                      : 'Delete?'}
                  </span>
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
            </RoleGuard>
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
