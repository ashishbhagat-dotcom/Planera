import { useState } from 'react'
import {
  CircleUser, ChevronDown, ChevronRight, RefreshCw,
  Circle, CircleDot, Timer, Eye, CheckCircle2, XCircle,
  AlertCircle, ArrowUp, ArrowDown, Minus, MoreHorizontal,
} from 'lucide-react'
import { useMyIssues } from '../hooks/useMyIssues'
import { IssueRow } from './IssueRow'
import { IssueListSkeleton } from './IssueListSkeleton'
import { EmptyState } from '@/shared/components/data/EmptyState'
import { cn } from '@/shared/lib/utils'
import type { Issue } from '@/shared/types/models'
import { IssueStatus, IssuePriority } from '@/shared/types/enums'

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER = [
  IssueStatus.BACKLOG,
  IssueStatus.TODO,
  IssueStatus.IN_PROGRESS,
  IssueStatus.IN_REVIEW,
  IssueStatus.DONE,
  IssueStatus.CANCELLED,
]

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  backlog:     <Circle size={13} className="text-[var(--text-muted)]" />,
  todo:        <CircleDot size={13} className="text-gray-400" />,
  in_progress: <Timer size={13} className="text-amber-400" />,
  in_review:   <Eye size={13} className="text-blue-400" />,
  done:        <CheckCircle2 size={13} className="text-emerald-500" />,
  cancelled:   <XCircle size={13} className="text-red-400" />,
}

const PRIORITY_ORDER = [
  IssuePriority.URGENT,
  IssuePriority.HIGH,
  IssuePriority.MEDIUM,
  IssuePriority.LOW,
  IssuePriority.NONE,
]

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
}

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  urgent: <AlertCircle size={13} className="text-red-500" />,
  high:   <ArrowUp size={13} className="text-orange-400" />,
  medium: <Minus size={13} className="text-yellow-400" />,
  low:    <ArrowDown size={13} className="text-blue-400" />,
  none:   <MoreHorizontal size={13} className="text-[var(--text-muted)]" />,
}

type GroupBy = 'status' | 'priority' | 'project'

// ── Grouping logic ────────────────────────────────────────────────────────────

function groupIssues(issues: Issue[], by: GroupBy): { key: string; label: string; icon: React.ReactNode; items: Issue[] }[] {
  if (by === 'status') {
    return STATUS_ORDER
      .map((s) => ({
        key: s,
        label: STATUS_LABEL[s] ?? s,
        icon: STATUS_ICON[s],
        items: issues.filter((i) => i.status === s),
      }))
      .filter((g) => g.items.length > 0)
  }

  if (by === 'priority') {
    return PRIORITY_ORDER
      .map((p) => ({
        key: p,
        label: PRIORITY_LABEL[p] ?? p,
        icon: PRIORITY_ICON[p],
        items: issues.filter((i) => i.priority === p),
      }))
      .filter((g) => g.items.length > 0)
  }

  // group by project
  const projectMap = new Map<string, Issue[]>()
  for (const issue of issues) {
    const key = issue.project_key ?? issue.identifier.replace(/-\d+$/, '')
    if (!projectMap.has(key)) projectMap.set(key, [])
    projectMap.get(key)!.push(issue)
  }
  return Array.from(projectMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({
      key,
      label: items[0].project_name ?? key,
      icon: <span className="inline-flex h-[13px] w-[13px] items-center justify-center rounded-sm bg-[var(--accent)] text-[8px] font-bold text-white">{key.charAt(0)}</span>,
      items,
    }))
}

// ── Group section ─────────────────────────────────────────────────────────────

interface GroupSectionProps {
  groupKey: string
  label: string
  icon: React.ReactNode
  items: Issue[]
  showProject: boolean
}

function GroupSection({ groupKey, label, icon, items, showProject }: GroupSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-8 w-full items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 text-left transition-colors hover:bg-[var(--surface-hover)]"
      >
        <span className="text-[var(--text-muted)]">
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
          {icon}
          {label}
        </span>
        <span className="rounded-full bg-[var(--surface-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
          {items.length}
        </span>
      </button>

      {!collapsed && items.map((issue) => (
        <IssueRow key={issue.id} issue={issue} showProject={showProject} />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MyIssuesPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>('status')
  const { data: issues = [], isLoading, isError, refetch } = useMyIssues()

  const groups = groupIssues(issues, groupBy)
  const showProject = groupBy !== 'project'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-[var(--text-primary)]">My Issues</h2>
          {!isLoading && (
            <span className="rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
              {issues.length}
            </span>
          )}
        </div>

        {/* Group by selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Group by</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid h-8 shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-medium text-[var(--text-muted)]"
        style={{ gridTemplateColumns: '16px 16px 80px 1fr 160px 120px 24px', gap: '12px' }}
      >
        <span />
        <span />
        <span>ID</span>
        <span>Title</span>
        <span>Labels</span>
        <span>Due</span>
        <span className="text-center">@</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <IssueListSkeleton />
        ) : isError ? (
          <EmptyState
            icon={<RefreshCw size={24} />}
            title="Failed to load your issues"
            description="Something went wrong. Check your connection and try again."
            action={
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                <RefreshCw size={14} /> Retry
              </button>
            }
          />
        ) : issues.length === 0 ? (
          <EmptyState
            icon={<CircleUser size={28} />}
            title="No issues assigned to you"
            description="Issues assigned to you across all projects will appear here."
          />
        ) : (
          groups.map((group) => (
            <GroupSection
              key={group.key}
              groupKey={group.key}
              label={group.label}
              icon={group.icon}
              items={group.items}
              showProject={showProject}
            />
          ))
        )}
      </div>
    </div>
  )
}
