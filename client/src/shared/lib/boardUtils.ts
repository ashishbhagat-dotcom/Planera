import type { Issue } from '@/shared/types/models'
import { IssueStatus } from '@/shared/types/enums'

export type BoardData = Record<IssueStatus, Issue[]>

export function groupByStatus(issues: unknown): BoardData {
  const empty = (): BoardData => ({
    [IssueStatus.BACKLOG]: [],
    [IssueStatus.TODO]: [],
    [IssueStatus.IN_PROGRESS]: [],
    [IssueStatus.IN_REVIEW]: [],
    [IssueStatus.DONE]: [],
    [IssueStatus.CANCELLED]: [],
  })

  // Guard: corrupted cache (e.g. BoardData object written by old mutation code)
  if (!Array.isArray(issues)) return empty()

  const groups = empty()
  for (const issue of issues as Issue[]) {
    const bucket = groups[issue.status as IssueStatus]
    if (bucket) bucket.push(issue)
  }
  for (const key of Object.keys(groups) as IssueStatus[]) {
    groups[key].sort((a, b) => (a.position ?? '').localeCompare(b.position ?? ''))
  }
  return groups
}

export interface MoveBoardItemParams {
  activeId: string
  overId: string | null
  activeStatus: IssueStatus
  overStatus: IssueStatus
}

export function moveBoardItem(board: BoardData, params: MoveBoardItemParams): BoardData {
  const { activeId, overId, activeStatus, overStatus } = params
  const next: BoardData = { ...board }
  next[activeStatus] = [...board[activeStatus]]
  next[overStatus] = [...board[overStatus]]

  const fromIdx = next[activeStatus].findIndex((i) => i.id === activeId)
  if (fromIdx === -1) return board

  const [item] = next[activeStatus].splice(fromIdx, 1)
  const moved = { ...item, status: overStatus }

  if (overId) {
    const toIdx = next[overStatus].findIndex((i) => i.id === overId)
    if (toIdx === -1) {
      next[overStatus].push(moved)
    } else {
      next[overStatus].splice(toIdx, 0, moved)
    }
  } else {
    next[overStatus].push(moved)
  }

  return next
}

// Minimal fractional index on the client side
export function generatePositionBetween(before: string | null, after: string | null): string {
  const start = before ?? 'a0'
  const end = after ?? 'z9'

  if (start >= end) return start + 'a'

  const mid = midString(start, end)
  return mid || start + 'a'
}

function midString(prev: string, next: string): string {
  let p = 0
  let n = 0
  let pos = 0

  for (; pos < Math.max(prev.length, next.length); pos++) {
    const pc = pos < prev.length ? prev.charCodeAt(pos) : 96
    const nc = pos < next.length ? next.charCodeAt(pos) : 123

    if (pc === nc) {
      p = p * 27 + (pc - 96)
      n = n * 27 + (nc - 96)
    } else {
      p = p * 27 + (pc - 96)
      n = n * 27 + (nc - 96)
      break
    }
  }

  let mid = Math.ceil((p + n) / 2)
  let result = ''
  for (let i = pos; i >= 0; i--) {
    const digit = mid % 27
    result = String.fromCharCode(digit + 96) + result
    mid = Math.floor(mid / 27)
  }
  return result.replace(/^`+/, '') || prev + 'n'
}
