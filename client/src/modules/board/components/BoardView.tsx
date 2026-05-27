import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { Kanban, RefreshCw } from 'lucide-react'
import { ErrorBoundary } from '@/shared/components/data/ErrorBoundary'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import { CreateIssueModal } from '@/modules/issue/components/CreateIssueModal'
import { IssueStatus } from '@/shared/types/enums'
import { STATUS_ORDER } from '@/shared/lib/constants'
import { useBoardIssues } from '../hooks/useBoardIssues'
import { useBoardDnD } from '../hooks/useBoardDnD'
import { useBoardFilters } from '../hooks/useBoardFilters'
import { useBoardSocket } from '../hooks/useBoardSocket'
import { BoardColumn } from './BoardColumn'
import { BoardCard, BoardCardOverlay } from './BoardCard'
import { BoardHeader } from './BoardHeader'
import { BoardSkeleton } from './BoardSkeleton'
import { EmptyState } from '@/shared/components/data/EmptyState'
import type { BoardData } from '@/shared/lib/boardUtils'

export function BoardView() {
  const { key: projectKey = '' } = useParams<{ key: string }>()
  const { apiFilters } = useBoardFilters()
  const qc = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  useBoardSocket(projectKey)
  useKeyboardShortcut('c', () => setShowCreateModal(true))

  // Purge any cache entries that were corrupted by old mutation code writing BoardData
  // instead of Issue[]. Without this, the select function receives an object and throws.
  useEffect(() => {
    qc.removeQueries({ queryKey: ['issues', projectKey] })
  }, [projectKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const { boardData: serverBoard, isLoading, isError, refetch } = useBoardIssues(projectKey, apiFilters)

  // localBoard is ONLY active during an in-progress drag for instant visual feedback.
  // It is cleared the moment the drag ends so server state (with optimistic updates) takes over.
  const [localBoard, setLocalBoard] = useState<BoardData | null>(null)

  const activeBoardData: BoardData = localBoard ?? serverBoard

  const { activeCard, handleDragStart, handleDragOver, handleDragEnd } = useBoardDnD(
    projectKey,
    activeBoardData,
    setLocalBoard,
  )

  function onDragEnd(event: Parameters<typeof handleDragEnd>[0]) {
    handleDragEnd(event)
    // Always clear local board after drag so fresh server data (incl. optimistic cache) shows
    setLocalBoard(null)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  if (isLoading) return <BoardSkeleton />
  if (isError) return (
    <EmptyState
      icon={<RefreshCw size={24} />}
      title="Failed to load board"
      description="Something went wrong fetching issues. Check your connection and try again."
      action={
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      }
    />
  )

  const totalIssues = STATUS_ORDER.reduce(
    (sum, s) => sum + (activeBoardData[s as IssueStatus]?.length ?? 0),
    0,
  )

  return (
    <>
    <div className="flex h-full flex-col overflow-hidden px-6 py-4">
      <BoardHeader />

      {totalIssues === 0 ? (
        <EmptyState
          icon={<Kanban size={24} />}
          title="No issues yet"
          description="Use the + button at the bottom of any column to create your first issue."
        />
      ) : (
        <ErrorBoundary>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
              {STATUS_ORDER.map((status) => (
                <BoardColumn
                  key={status}
                  status={status as IssueStatus}
                  issues={activeBoardData[status as IssueStatus] ?? []}
                  projectKey={projectKey}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeCard ? (
                <BoardCardOverlay issue={activeCard} projectKey={projectKey} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </ErrorBoundary>
      )}
    </div>

    {showCreateModal && (
      <CreateIssueModal
        projectKey={projectKey}
        onClose={() => setShowCreateModal(false)}
      />
    )}
    </>
  )
}

