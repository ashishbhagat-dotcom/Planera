import { useState } from 'react'
import { format } from 'date-fns'
import {
  X, AlertCircle, ArrowUp, ArrowDown, Minus, MoreHorizontal,
  Circle, CircleDot, Timer, Eye, CheckCircle2, XCircle,
  MessageSquare, Activity, Calendar, Hash, User,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/stores/uiStore'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import { useIssue } from '../hooks/useIssues'
import { IssueStatus, IssuePriority } from '@/shared/types/enums'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/shared/lib/constants'
import type { Issue } from '@/shared/types/models'
import { Avatar } from '@/shared/components/ui/Avatar'

const STATUS_ICON: Record<IssueStatus, React.ReactNode> = {
  [IssueStatus.BACKLOG]:     <Circle size={14} className="text-[var(--text-muted)]" />,
  [IssueStatus.TODO]:        <CircleDot size={14} className="text-gray-400" />,
  [IssueStatus.IN_PROGRESS]: <Timer size={14} className="text-amber-400" />,
  [IssueStatus.IN_REVIEW]:   <Eye size={14} className="text-blue-400" />,
  [IssueStatus.DONE]:        <CheckCircle2 size={14} className="text-emerald-500" />,
  [IssueStatus.CANCELLED]:   <XCircle size={14} className="text-red-400" />,
}

const PRIORITY_ICON: Record<IssuePriority, React.ReactNode> = {
  [IssuePriority.URGENT]: <AlertCircle size={14} className="text-red-500" />,
  [IssuePriority.HIGH]:   <ArrowUp size={14} className="text-orange-400" />,
  [IssuePriority.MEDIUM]: <Minus size={14} className="text-yellow-400" />,
  [IssuePriority.LOW]:    <ArrowDown size={14} className="text-blue-400" />,
  [IssuePriority.NONE]:   <MoreHorizontal size={14} className="text-[var(--text-muted)]" />,
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <p className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
      <div className="text-sm text-[var(--text-primary)]">{children}</div>
    </div>
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

function PanelBody({ issue }: { issue: Issue }) {
  const [tab, setTab] = useState<'comments' | 'activity'>('comments')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Scrollable body */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Main — title + description */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {/* Identifier */}
          <span className="mb-2 font-mono text-xs text-[var(--text-muted)]">
            {issue.identifier}
          </span>

          {/* Title */}
          <h2 className="text-xl font-semibold leading-snug text-[var(--text-primary)]">
            {issue.title}
          </h2>

          {/* Description */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Description</p>
            {issue.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                {issue.description}
              </p>
            ) : (
              <p className="text-sm italic text-[var(--text-muted)]">No description</p>
            )}
          </div>

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

            <div className="py-6 text-center text-sm text-[var(--text-muted)]">
              {tab === 'comments' ? 'No comments yet.' : 'No activity yet.'}
            </div>
          </div>
        </div>

        {/* Right sidebar — properties */}
        <div className="w-56 shrink-0 overflow-y-auto border-l border-[var(--border)] px-4 py-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Properties
          </p>

          <PropertyRow label="Status">
            <span className="flex items-center gap-1.5">
              {STATUS_ICON[issue.status as IssueStatus]}
              {STATUS_LABELS[issue.status as IssueStatus]}
            </span>
          </PropertyRow>

          <PropertyRow label="Priority">
            <span className="flex items-center gap-1.5">
              {PRIORITY_ICON[issue.priority as IssuePriority]}
              {PRIORITY_LABELS[issue.priority as IssuePriority]}
            </span>
          </PropertyRow>

          <PropertyRow label="Assignee">
            {issue.assignee ? (
              <span className="flex items-center gap-1.5">
                <Avatar
                  src={issue.assignee.avatar_url}
                  name={issue.assignee.full_name || issue.assignee.email}
                  size="sm"
                />
                <span className="truncate text-xs">
                  {issue.assignee.full_name || issue.assignee.email}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <User size={14} />
                Unassigned
              </span>
            )}
          </PropertyRow>

          <PropertyRow label="Labels">
            {issue.labels?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {issue.labels.map((l) => (
                  <span
                    key={l.id}
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[var(--text-muted)]">None</span>
            )}
          </PropertyRow>

          <PropertyRow label="Due date">
            {issue.due_date ? (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[var(--text-muted)]" />
                {format(new Date(issue.due_date), 'MMM d, yyyy')}
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">None</span>
            )}
          </PropertyRow>

          {issue.estimate != null && (
            <PropertyRow label="Estimate">
              <span className="flex items-center gap-1.5">
                <Hash size={13} className="text-[var(--text-muted)]" />
                {issue.estimate}
              </span>
            </PropertyRow>
          )}

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
    </div>
  )
}

export function IssueDetailPanel() {
  const { activeIssueId, setActiveIssueId } = useUiStore()
  const isOpen = !!activeIssueId

  const projectKey = activeIssueId?.replace(/-\d+$/, '') ?? ''
  const { data: issue, isLoading } = useIssue(projectKey, activeIssueId ?? '')

  const close = () => setActiveIssueId(null)
  useKeyboardShortcut('Escape', close, { enabled: isOpen })

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
        {/* Panel header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {activeIssueId ?? ''}
          </span>
          <button
            onClick={close}
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {isLoading || !issue ? <PanelSkeleton /> : <PanelBody issue={issue} />}
      </div>
    </>
  )
}
