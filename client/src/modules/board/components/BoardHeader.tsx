import { X, LayoutGrid, List, Filter } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/stores/uiStore'
import { useBoardFilters } from '../hooks/useBoardFilters'
import { PRIORITY_LABELS } from '@/shared/lib/constants'
import { IssuePriority } from '@/shared/types/enums'

interface Props {
  projectName?: string
}

export function BoardHeader({ projectName }: Props) {
  const { boardViewMode, setBoardViewMode } = useUiStore()
  const navigate = useNavigate()
  const { key } = useParams<{ key: string }>()
  const { priorityFilter, setPriorityFilter, activeFilterCount, resetAll } = useBoardFilters()

  function togglePriority(p: string) {
    setPriorityFilter(
      priorityFilter.includes(p) ? priorityFilter.filter((x) => x !== p) : [...priorityFilter, p],
    )
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4">
      <h1 className="text-base font-semibold text-[var(--text-primary)]">
        {projectName ?? 'Board'}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Priority filter chips */}
        <div className="flex items-center gap-1">
          <Filter size={13} className="text-[var(--text-muted)]" />
          {Object.values(IssuePriority).map((p) => (
            <button
              key={p}
              onClick={() => togglePriority(p)}
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                priorityFilter.includes(p)
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              )}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={11} />
            Clear ({activeFilterCount})
          </button>
        )}

        {/* View mode toggle */}
        <div className="flex items-center rounded-md border border-[var(--border)]">
          <button
            onClick={() => {
              setBoardViewMode('kanban')
              navigate(`/app/projects/${key}/board`)
            }}
            className={cn(
              'rounded-l-md p-1.5 transition-colors',
              boardViewMode === 'kanban'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
            )}
            title="Kanban view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => {
              setBoardViewMode('list')
              navigate(`/app/projects/${key}/issues`)
            }}
            className={cn(
              'rounded-r-md p-1.5 transition-colors',
              boardViewMode === 'list'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
            )}
            title="List view"
          >
            <List size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
