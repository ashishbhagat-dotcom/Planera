import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/stores/uiStore'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { issueApi } from '@/modules/issue/services/issueApi'
import { useWorkspaceStore } from '@/modules/workspace/stores/workspaceStore'
import { PRIORITY_ICON } from '@/modules/issue/components/PriorityIcon'
import { STATUS_ICON } from '@/modules/issue/components/StatusBadge'
import { STATUS_LABELS } from '@/shared/lib/constants'
import type { Issue } from '@/shared/types/models'
import type { IssueStatus, IssuePriority } from '@/shared/types/enums'

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace)

  const debouncedQuery = useDebounce(query, 250)

  const { data, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, currentWorkspace?.slug],
    queryFn: () => issueApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  })

  const results: Issue[] = data ?? []

  // Reset state when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [commandPaletteOpen])

  // Keep selectedIndex in bounds when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [debouncedQuery])

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  function close() {
    setCommandPaletteOpen(false)
  }

  function openIssue(issue: Issue) {
    const projectKey = issue.identifier.replace(/-\d+$/, '')
    navigate(`/app/projects/${projectKey}/board`)
    useUiStore.getState().setActiveIssueId(issue.identifier)
    close()
  }

  useKeyboardShortcut('Escape', close, { enabled: commandPaletteOpen })

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      openIssue(results[selectedIndex])
    }
  }

  if (!commandPaletteOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[20vh] z-50 mx-auto w-full max-w-xl px-4">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search issues…"
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            {isFetching && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            )}
            <button
              onClick={close}
              className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
            {debouncedQuery.length < 2 ? (
              <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                Type at least 2 characters to search
              </p>
            ) : results.length === 0 && !isFetching ? (
              <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                No issues found for "{debouncedQuery}"
              </p>
            ) : (
              results.map((issue, idx) => (
                <button
                  key={issue.id}
                  onClick={() => openIssue(issue)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    idx === selectedIndex
                      ? 'bg-[var(--surface-hover)]'
                      : 'hover:bg-[var(--surface-hover)]',
                  )}
                >
                  <span className="shrink-0">{PRIORITY_ICON[issue.priority as IssuePriority]}</span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    {issue.identifier}
                  </span>
                  <span className="flex-1 truncate text-sm text-[var(--text-primary)]">
                    {issue.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--text-muted)]">
                    {STATUS_ICON[issue.status as IssueStatus]}
                    {STATUS_LABELS[issue.status as IssueStatus]}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-2">
            <span className="text-[11px] text-[var(--text-muted)]">
              <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[10px]">↵</kbd> open
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[10px]">Esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
