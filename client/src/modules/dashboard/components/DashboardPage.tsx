import { LayoutDashboard } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { StatCard } from './StatCard'
import { StatusChart } from './StatusChart'
import { ActivityFeed } from './ActivityFeed'

export function DashboardPage() {
  const { data, isLoading } = useDashboardStats()

  const totalIssues = data
    ? Object.values(data.issue_counts_by_status).reduce((a, b) => a + b, 0)
    : undefined

  const doneCount = data?.issue_counts_by_status['done']

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-6 py-4">
        <LayoutDashboard size={16} className="text-[var(--text-muted)]" />
        <h1 className="text-sm font-medium text-[var(--text-primary)]">Dashboard</h1>
      </div>

      <div className="flex-1 space-y-6 p-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Open Issues"
            value={data?.open_issues}
            isLoading={isLoading}
            accent="var(--accent)"
          />
          <StatCard
            label="Completed"
            value={doneCount}
            isLoading={isLoading}
            trend="up"
          />
          <StatCard
            label="Overdue"
            value={data?.overdue_count}
            isLoading={isLoading}
            accent={data?.overdue_count ? '#ef4444' : undefined}
            trend={data?.overdue_count ? 'down' : 'neutral'}
          />
          <StatCard
            label="Total Issues"
            value={totalIssues}
            isLoading={isLoading}
          />
        </div>

        {/* Chart + Activity side by side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Status distribution chart */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 lg:col-span-3">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Issues by Status
            </h2>
            <StatusChart
              counts={data?.issue_counts_by_status}
              isLoading={isLoading}
            />
          </div>

          {/* Recent activity */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 lg:col-span-2">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Recent Activity
            </h2>
            <ActivityFeed
              activities={data?.recent_activity}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Issues by Priority
          </h2>
          {isLoading ? (
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 flex-1 animate-pulse rounded bg-[var(--surface-hover)]" />
              ))}
            </div>
          ) : (
            <PriorityBars counts={data?.issue_counts_by_priority} total={totalIssues ?? 0} />
          )}
        </div>
      </div>
    </div>
  )
}

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low', 'none']
const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
}
const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  none: '#6b7280',
}

function PriorityBars({
  counts,
  total,
}: {
  counts: Record<string, number> | undefined
  total: number
}) {
  if (!counts || total === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No data.</p>
  }

  return (
    <div className="space-y-2.5">
      {PRIORITY_ORDER.map((p) => {
        const count = counts[p] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={p} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-[var(--text-muted)]">
              {PRIORITY_LABELS[p]}
            </span>
            <div className="flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: PRIORITY_COLORS[p],
                  minWidth: count > 0 ? 4 : 0,
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs tabular-nums text-[var(--text-muted)]">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
