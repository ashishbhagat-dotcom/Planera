import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { issueApi, type IssueFilters } from '../services/issueApi'
import { useWorkspaceStore } from '@/modules/workspace/stores/workspaceStore'

export function useMyIssues(filters: IssueFilters = {}) {
  const slug = useWorkspaceStore((s) => s.currentWorkspace?.slug)
  return useQuery({
    queryKey: queryKeys.issues.mine(filters),
    queryFn: () => issueApi.myIssues(filters),
    enabled: !!slug,
  })
}
