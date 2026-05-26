import { useState } from 'react'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { IssueStatus } from '@/shared/types/enums'
import type { Issue } from '@/shared/types/models'
import { generatePositionBetween } from '@/shared/lib/boardUtils'
import { useMoveIssue } from '@/modules/issue/hooks/useIssueMutations'
import type { BoardData } from '@/shared/lib/boardUtils'

const ALL_STATUSES = new Set<string>(Object.values(IssueStatus))

// Resolve the target column status from a drag-over event.
// over.id may be a card UUID or a column status string (for empty columns).
function resolveOverStatus(over: DragOverEvent['over']): IssueStatus | null {
  if (!over) return null
  // Card hover: containerId set by SortableContext
  const fromSortable = over.data.current?.sortable?.containerId
  if (fromSortable && ALL_STATUSES.has(fromSortable)) return fromSortable as IssueStatus
  // Empty column hover: id is the status string itself
  if (ALL_STATUSES.has(over.id as string)) return over.id as IssueStatus
  return null
}

function resolveActiveStatus(active: DragStartEvent['active'], board: BoardData): IssueStatus | null {
  // Prefer sortable containerId (fast path)
  const fromSortable = active.data.current?.sortable?.containerId
  if (fromSortable && ALL_STATUSES.has(fromSortable)) return fromSortable as IssueStatus
  // Fallback: scan board
  for (const [status, items] of Object.entries(board)) {
    if (items.some((i) => i.id === active.id)) return status as IssueStatus
  }
  return null
}

export function useBoardDnD(
  projectKey: string,
  boardData: BoardData,
  setBoardData: (data: BoardData | null) => void,
) {
  const [activeCard, setActiveCard] = useState<Issue | null>(null)
  const moveIssue = useMoveIssue(projectKey)

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string
    const issue = Object.values(boardData).flat().find((i) => i.id === id)
    setActiveCard(issue ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeStatus = resolveActiveStatus(active, boardData)
    const overStatus = resolveOverStatus(over)

    if (!activeStatus || !overStatus) return
    if (activeStatus === overStatus) return

    const activeCol = [...boardData[activeStatus]]
    const overCol = [...boardData[overStatus]]

    const fromIdx = activeCol.findIndex((i) => i.id === activeId)
    if (fromIdx === -1) return

    const [item] = activeCol.splice(fromIdx, 1)
    const movedItem = { ...item, status: overStatus }

    const toIdx = overCol.findIndex((i) => i.id === overId)
    if (toIdx === -1) {
      overCol.push(movedItem)
    } else {
      overCol.splice(toIdx, 0, movedItem)
    }

    setBoardData({ ...boardData, [activeStatus]: activeCol, [overStatus]: overCol })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find card in post-drag-over state
    let foundStatus: IssueStatus | null = null
    let colItems: Issue[] = []
    for (const [status, items] of Object.entries(boardData)) {
      const idx = items.findIndex((i) => i.id === activeId)
      if (idx !== -1) {
        foundStatus = status as IssueStatus
        colItems = items
        break
      }
    }
    if (!foundStatus) return

    const currentIdx = colItems.findIndex((i) => i.id === activeId)
    const overIdx = colItems.findIndex((i) => i.id === overId)

    let finalItems = colItems
    if (currentIdx !== -1 && overIdx !== -1 && currentIdx !== overIdx) {
      finalItems = arrayMove(colItems, currentIdx, overIdx)
      setBoardData({ ...boardData, [foundStatus]: finalItems })
    }

    const finalIdx = finalItems.findIndex((i) => i.id === activeId)
    const before = finalIdx > 0 ? finalItems[finalIdx - 1].position : null
    const after = finalIdx < finalItems.length - 1 ? finalItems[finalIdx + 1].position : null
    const newPosition = generatePositionBetween(before, after)

    const issue = finalItems[finalIdx]
    moveIssue.mutate({ identifier: issue.identifier, status: foundStatus, position: newPosition })
  }

  return { activeCard, handleDragStart, handleDragOver, handleDragEnd }
}
