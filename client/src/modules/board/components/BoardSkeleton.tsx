export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto px-6 py-4">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="flex w-72 shrink-0 flex-col">
          {/* Column header */}
          <div className="mb-3 flex items-center gap-2 px-1">
            <div className="size-2 animate-pulse rounded-full bg-[var(--surface-hover)]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface-hover)]" />
            <div className="ml-auto h-3 w-4 animate-pulse rounded bg-[var(--surface-hover)]" />
          </div>
          {/* Cards */}
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, card) => (
              <div
                key={card}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="size-3 animate-pulse rounded-full bg-[var(--surface-hover)]" />
                  <div className="h-2.5 w-12 animate-pulse rounded bg-[var(--surface-hover)]" />
                </div>
                <div className="mb-1 h-3 w-full animate-pulse rounded bg-[var(--surface-hover)]" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--surface-hover)]" />
                <div className="mt-3 flex justify-end">
                  <div className="size-5 animate-pulse rounded-full bg-[var(--surface-hover)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
