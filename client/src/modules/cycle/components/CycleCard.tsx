import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import type { Cycle } from '../services/cycleApi'
import { CycleProgressBar } from './CycleProgressBar'

const STATUS_CHIP: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-[var(--surface-hover)] text-[var(--text-muted)]',
}

interface Props {
  cycle: Cycle
  projectKey: string
}

export function CycleCard({ cycle, projectKey }: Props) {
  return (
    <Link
      to={`/app/projects/${projectKey}/cycles/${cycle.id}`}
      className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-[var(--text-primary)]">{cycle.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <CalendarDays size={12} />
            <span>{cycle.start_date}</span>
            <span>→</span>
            <span>{cycle.end_date}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CHIP[cycle.status] ?? ''}`}>
          {cycle.status}
        </span>
      </div>
      <div className="mt-3">
        <CycleProgressBar progress={cycle.progress} />
      </div>
    </Link>
  )
}
