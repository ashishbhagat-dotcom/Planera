import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { useWorkspaceStore } from '@/modules/workspace/stores/workspaceStore'
import { dashboardApi } from '../services/dashboardApi'

export function useDashboardStats(projectKey?: string) {
  const slug = useWorkspaceStore((s) => s.currentWorkspace?.slug ?? '')

  return useQuery({
    queryKey: queryKeys.dashboard.stats(slug, projectKey),
    queryFn: () => dashboardApi.getStats(slug, projectKey),
    enabled: !!slug,
  })
}
