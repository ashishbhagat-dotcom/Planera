import ReactMarkdown from 'react-markdown'
import { AILoadingState } from './AILoadingState'
import type { AIResult, EstimateResult } from '../services/aiApi'

interface Props {
  action: string
  result: AIResult | null
  isLoading: boolean
  error: Error | null
  onApply: (result: AIResult) => void
  onDiscard: () => void
}

function EstimateDisplay({ data }: { data: EstimateResult }) {
  return (
    <div className="space-y-1 text-xs text-[var(--text-primary)]">
      <div className="flex gap-4">
        <span><span className="text-[var(--text-muted)]">Points: </span><strong>{data.story_points}</strong></span>
        <span><span className="text-[var(--text-muted)]">Priority: </span><strong className="capitalize">{data.priority}</strong></span>
      </div>
      {data.reasoning && (
        <p className="text-[var(--text-muted)] italic">{data.reasoning}</p>
      )}
    </div>
  )
}

function SubtasksDisplay({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-4 space-y-1">
      {items.map((t, i) => (
        <li key={i} className="text-xs text-[var(--text-primary)]">{t}</li>
      ))}
    </ul>
  )
}

export function AIResultPanel({ action, result, isLoading, error, onApply, onDiscard }: Props) {
  if (isLoading) return <AILoadingState />

  if (error) {
    return (
      <div className="p-3 text-xs text-red-400">
        AI unavailable — {error.message}
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="flex flex-col gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">
        {action === 'improve_description' && 'Improved Description'}
        {action === 'generate_subtasks' && 'Suggested Sub-tasks'}
        {action === 'estimate_effort' && 'Effort Estimate'}
      </div>

      <div className="max-h-60 overflow-y-auto">
        {action === 'improve_description' && typeof result === 'string' && (
          <div className="prose prose-sm prose-invert max-w-none text-xs text-[var(--text-primary)]">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
        {action === 'generate_subtasks' && Array.isArray(result) && (
          <SubtasksDisplay items={result as string[]} />
        )}
        {action === 'estimate_effort' && typeof result === 'object' && !Array.isArray(result) && (
          <EstimateDisplay data={result as EstimateResult} />
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onApply(result)}
          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Apply
        </button>
        <button
          onClick={onDiscard}
          className="rounded-md px-3 py-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)]"
        >
          Discard
        </button>
      </div>
    </div>
  )
}
