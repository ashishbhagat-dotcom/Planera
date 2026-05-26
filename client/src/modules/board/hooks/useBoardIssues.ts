import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { boardApi } from '../services/boardApi'
import { groupByStatus, type BoardData } from '@/shared/lib/boardUtils'
import type { IssueFilters } from '@/modules/issue/services/issueApi'
import type { Issue } from '@/shared/types/models'

// Stable key — always fetches the full project board, no filter variants in the key.
// Filtering is done client-side so there's only ever one cache entry per project.
const boardQueryKey = (projectKey: string) => ['issues', projectKey, 'board'] as const

export function useBoardIssues(projectKey: string, filters: IssueFilters = {}) {
  const query = useQuery({
    queryKey: boardQueryKey(projectKey),
    queryFn: () => boardApi.getIssues(projectKey),
    enabled: !!projectKey,
  })

  const boardData: BoardData = useMemo(() => {
    let issues: Issue[] = Array.isArray(query.data) ? query.data : []

    // Client-side filter to avoid one cache entry per filter combination
    if (filters.priority) {
      const allowed = new Set(filters.priority.split(','))
      issues = issues.filter((i) => allowed.has(i.priority))
    }
    if (filters.status) {
      const allowed = new Set(filters.status.split(','))
      issues = issues.filter((i) => allowed.has(i.status))
    }
    if (filters.assignee_id) {
      const allowed = new Set(filters.assignee_id.split(','))
      issues = issues.filter((i) => i.assignee && allowed.has(i.assignee.id))
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      issues = issues.filter((i) => i.title.toLowerCase().includes(q))
    }

    return groupByStatus(issues)
  }, [query.data, filters.priority, filters.status, filters.assignee_id, filters.search])

  return { ...query, boardData }
}

// Export the stable key so mutations can invalidate it
export { boardQueryKey }
