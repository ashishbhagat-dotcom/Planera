import { useState, useRef, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { AIAction } from '../services/aiApi'

interface Props {
  onSelectAction: (action: AIAction) => void
  isPending: boolean
}

const ACTIONS: { id: AIAction; label: string; icon: string }[] = [
  { id: 'improve_description', label: 'Improve description', icon: '✨' },
  { id: 'generate_subtasks',   label: 'Generate sub-tasks',  icon: '🔀' },
  { id: 'estimate_effort',     label: 'Estimate effort',     icon: '⚡' },
]

export function AIAssistButton({ onSelectAction, isPending }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(action: AIAction) {
    setOpen(false)
    onSelectAction(action)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn(
          'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
          'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
          open && 'bg-[var(--surface-hover)]',
          isPending && 'opacity-50 cursor-not-allowed',
        )}
        aria-label="AI Assist"
      >
        <Sparkles size={13} className={isPending ? 'animate-pulse' : ''} />
        <span>{isPending ? 'Thinking…' : 'AI'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-md border border-[var(--border)] bg-[var(--background)] shadow-lg">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => handleSelect(a.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              <span>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
