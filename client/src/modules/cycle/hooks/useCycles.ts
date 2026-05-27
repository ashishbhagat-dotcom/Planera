import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { getActiveCycle, listCycles } from '../services/cycleApi'

export function useCycles(projectKey: string) {
  return useQuery({
    queryKey: queryKeys.cycles.all(projectKey),
    queryFn: () => listCycles(projectKey),
    enabled: !!projectKey,
  })
}

export function useActiveCycle(projectKey: string) {
  return useQuery({
    queryKey: queryKeys.cycles.active(projectKey),
    queryFn: () => getActiveCycle(projectKey),
    enabled: !!projectKey,
  })
}
