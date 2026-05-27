interface Props {
  progress: number
  issueCounts?: Record<string, number>
  className?: string
}

export function CycleProgressBar({ progress, issueCounts, className = '' }: Props) {
  const total = issueCounts ? Object.values(issueCounts).reduce((a, b) => a + b, 0) : 0
  const done = total > 0 ? ((issueCounts?.done ?? 0) + (issueCounts?.cancelled ?? 0)) / total * 100 : 0
  const inProgress = total > 0 ? ((issueCounts?.in_progress ?? 0) + (issueCounts?.in_review ?? 0)) / total * 100 : 0
  const displayProgress = issueCounts ? done : progress

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]">
        {issueCounts && total > 0 ? (
          <>
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${done}%` }}
            />
            <div
              className="bg-blue-400 transition-all duration-500"
              style={{ width: `${inProgress}%` }}
            />
          </>
        ) : (
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${displayProgress}%` }}
          />
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)]">{Math.round(displayProgress)}% complete</p>
    </div>
  )
}
