import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/Skeleton'

interface StatCardProps {
  label: string
  value: number | undefined
  isLoading?: boolean
  trend?: 'up' | 'down' | 'neutral'
  accent?: string
}

export function StatCard({ label, value, isLoading, trend, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between">
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <span
            className="text-3xl font-semibold tabular-nums text-[var(--text-primary)]"
            style={accent ? { color: accent } : undefined}
          >
            {value ?? 0}
          </span>
        )}
        {trend && !isLoading && (
          <span
            className={`mb-1 flex items-center gap-0.5 text-xs font-medium ${
              trend === 'up'
                ? 'text-green-500'
                : trend === 'down'
                  ? 'text-red-500'
                  : 'text-[var(--text-muted)]'
            }`}
          >
            {trend === 'up' && <TrendingUp size={13} />}
            {trend === 'down' && <TrendingDown size={13} />}
            {trend === 'neutral' && <Minus size={13} />}
          </span>
        )}
      </div>
    </div>
  )
}
