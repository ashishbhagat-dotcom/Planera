export function AILoadingState() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-transparent" />
        Thinking…
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-[var(--surface-hover)]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--surface-hover)]" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-[var(--surface-hover)]" />
      </div>
    </div>
  )
}
