import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { useCycles } from '../hooks/useCycles'
import { CycleCard } from './CycleCard'
import { CreateCycleModal } from './CreateCycleModal'

export function CycleList() {
  const { key = '' } = useParams<{ key: string }>()
  const { data: cycles = [], isLoading, isError, refetch } = useCycles(key)
  const [showCreate, setShowCreate] = useState(false)

  const active = cycles.filter((c) => c.status === 'active')
  const upcoming = cycles.filter((c) => c.status === 'upcoming')
  const completed = cycles.filter((c) => c.status === 'completed')

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-[var(--text-muted)]">Failed to load cycles.</p>
        <button onClick={() => refetch()} className="text-sm text-[var(--accent)] hover:underline">
          Retry
        </button>
      </div>
    )
  }

  function Section({ title, items }: { title: string; items: typeof cycles }) {
    if (!items.length) return null
    return (
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <CycleCard key={c.id} cycle={c} projectKey={key} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
        <h1 className="text-sm font-semibold text-[var(--text-primary)]">Cycles</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          <Plus size={14} />
          New cycle
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {cycles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-sm text-[var(--text-muted)]">No cycles yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Create your first cycle
            </button>
          </div>
        ) : (
          <>
            <Section title="Active" items={active} />
            <Section title="Upcoming" items={upcoming} />
            <Section title="Completed" items={completed} />
          </>
        )}
      </div>

      {showCreate && (
        <CreateCycleModal projectKey={key} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
