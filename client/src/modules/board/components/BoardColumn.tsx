import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { IssueStatus } from '@/shared/types/enums'
import type { Issue } from '@/shared/types/models'
import { STATUS_LABELS } from '@/shared/lib/constants'
import { BoardCard } from './BoardCard'
import { QuickCreateCard } from './QuickCreateCard'

const STATUS_DOT: Record<IssueStatus, string> = {
  backlog:     'bg-[var(--status-backlog,#6b7280)]',
  todo:        'bg-gray-400',
  in_progress: 'bg-amber-400',
  in_review:   'bg-blue-400',
  done:        'bg-emerald-500',
  cancelled:   'bg-red-400',
}

interface Props {
  status: IssueStatus
  issues: Issue[]
  projectKey: string
  focusedId?: string | null
}

export function BoardColumn({ status, issues, projectKey, focusedId }: Props) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {STATUS_LABELS[status]}
        </span>
        <span className="ml-auto text-xs text-[var(--text-muted)]">{issues.length}</span>
      </div>

      {/* Droppable + sortable zone */}
      <SortableContext
        id={status}
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="flex min-h-[80px] flex-1 flex-col gap-2 overflow-y-auto rounded-md p-1 transition-colors data-[dragging-over]:bg-[var(--surface-hover)]/40"
        >
          {issues.map((issue) => (
            <BoardCard key={issue.id} issue={issue} projectKey={projectKey} focused={focusedId === issue.identifier} />
          ))}
        </div>
      </SortableContext>

      {/* Quick create */}
      <div className="mt-2 px-1">
        <QuickCreateCard projectKey={projectKey} status={status} />
      </div>
    </div>
  )
}
