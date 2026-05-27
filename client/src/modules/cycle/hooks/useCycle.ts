import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { getCycle } from '../services/cycleApi'

export function useCycle(projectKey: string, cycleId: string) {
  return useQuery({
    queryKey: queryKeys.cycles.detail(cycleId),
    queryFn: () => getCycle(projectKey, cycleId),
    enabled: !!projectKey && !!cycleId,
  })
}
