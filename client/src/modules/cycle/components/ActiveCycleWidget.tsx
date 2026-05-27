import { Link } from 'react-router-dom'
import { Timer } from 'lucide-react'
import { useActiveCycle } from '../hooks/useCycles'

interface Props {
  projectKey: string
}

export function ActiveCycleWidget({ projectKey }: Props) {
  const { data: cycle } = useActiveCycle(projectKey)
  if (!cycle) return null

  return (
    <Link
      to={`/app/projects/${projectKey}/cycles/${cycle.id}`}
      className="mx-2 mb-1 flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs hover:bg-[var(--surface-hover)]"
    >
      <Timer size={12} className="shrink-0 text-green-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--text-primary)]">{cycle.name}</p>
        <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${cycle.progress}%` }}
          />
        </div>
      </div>
      <span className="shrink-0 text-[var(--text-muted)]">{cycle.progress}%</span>
    </Link>
  )
}
