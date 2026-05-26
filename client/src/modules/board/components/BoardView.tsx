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
import { IssueStatus } from '@/shared/types/enums'
import { STATUS_ORDER } from '@/shared/lib/constants'
import { useBoardIssues } from '../hooks/useBoardIssues'
import { useBoardDnD } from '../hooks/useBoardDnD'
import { useBoardFilters } from '../hooks/useBoardFilters'
import { BoardColumn } from './BoardColumn'
import { BoardCard, BoardCardOverlay } from './BoardCard'
import { BoardHeader } from './BoardHeader'
import type { BoardData } from '@/shared/lib/boardUtils'

export function BoardView() {
  const { key: projectKey = '' } = useParams<{ key: string }>()
  const { apiFilters } = useBoardFilters()
  const qc = useQueryClient()

  // Purge any cache entries that were corrupted by old mutation code writing BoardData
  // instead of Issue[]. Without this, the select function receives an object and throws.
  useEffect(() => {
    qc.removeQueries({ queryKey: ['issues', projectKey] })
  }, [projectKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const { boardData: serverBoard, isLoading, isError } = useBoardIssues(projectKey, apiFilters)

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
  if (isError) return <div className="p-8 text-sm text-red-400">Failed to load board.</div>

  return (
    <div className="flex h-full flex-col overflow-hidden px-6 py-4">
      <BoardHeader />

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

        <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeCard ? (
            <BoardCardOverlay issue={activeCard} projectKey={projectKey} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto px-6 py-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex w-72 shrink-0 flex-col gap-3">
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-[var(--surface-hover)]" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-24 animate-pulse rounded-md bg-[var(--surface-hover)]" />
          ))}
        </div>
      ))}
    </div>
  )
}
