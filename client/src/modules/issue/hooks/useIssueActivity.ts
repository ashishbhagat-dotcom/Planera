import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { issueApi } from '../services/issueApi'
import type { Activity } from '@/shared/types/models'

export function useIssueActivity(projectKey: string, identifier: string) {
  return useQuery<Activity[]>({
    queryKey: queryKeys.issues.activity(identifier),
    queryFn: () => issueApi.listActivity(projectKey, identifier),
    enabled: !!projectKey && !!identifier,
  })
}
