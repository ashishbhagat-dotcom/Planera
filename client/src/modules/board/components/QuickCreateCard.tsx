import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useCreateIssue } from '@/modules/issue/hooks/useIssueMutations'
import type { IssueStatus } from '@/shared/types/enums'

interface Props {
  projectKey: string
  status: IssueStatus
}

export function QuickCreateCard({ projectKey, status }: Props) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const createIssue = useCreateIssue(projectKey)

  function open() {
    setActive(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function close() {
    setActive(false)
    setTitle('')
  }

  async function submit() {
    const trimmed = title.trim()
    if (!trimmed) { close(); return }
    createIssue.mutate({ title: trimmed, status })
    close()
  }

  if (!active) {
    return (
      <button
        onClick={open}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[var(--text-muted)]',
          'transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        )}
      >
        <Plus size={13} />
        Add issue
      </button>
    )
  }

  return (
    <div className="rounded-md border border-[var(--accent)]/50 bg-[var(--surface)] p-2">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') close()
        }}
        placeholder="Issue title..."
        className="w-full bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
      />
      <div className="mt-1.5 flex gap-2 text-xs text-[var(--text-muted)]">
        <span>Enter to save</span>
        <span>Esc to cancel</span>
      </div>
    </div>
  )
}
