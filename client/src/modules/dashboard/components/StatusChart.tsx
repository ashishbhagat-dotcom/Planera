import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { STATUS_LABELS, STATUS_ORDER } from '@/shared/lib/constants'
import type { IssueStatus } from '@/shared/types/enums'

const STATUS_CHART_COLORS: Record<string, string> = {
  backlog: '#6b7280',
  todo: '#e5e7eb',
  in_progress: '#3b82f6',
  in_review: '#a855f7',
  done: '#22c55e',
  cancelled: '#ef4444',
}

interface StatusChartProps {
  counts: Record<string, number> | undefined
  isLoading?: boolean
}

export function StatusChart({ counts, isLoading }: StatusChartProps) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  const data = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status as IssueStatus],
    count: counts?.[status] ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={192}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--surface-hover)' }}
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-primary)',
          }}
          formatter={(value: number) => [value, 'Issues']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_CHART_COLORS[entry.status] ?? '#6b7280'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
