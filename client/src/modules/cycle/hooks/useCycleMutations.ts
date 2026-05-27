import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { createCycle, patchCycle, setIssueCycle, type CreateCyclePayload } from '../services/cycleApi'

export function useCreateCycle(projectKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCyclePayload) => createCycle(projectKey, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cycles.all(projectKey) })
      qc.invalidateQueries({ queryKey: queryKeys.cycles.active(projectKey) })
    },
  })
}

export function useUpdateCycle(projectKey: string, cycleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<CreateCyclePayload>) => patchCycle(projectKey, cycleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cycles.all(projectKey) })
      qc.invalidateQueries({ queryKey: queryKeys.cycles.detail(cycleId) })
      qc.invalidateQueries({ queryKey: queryKeys.cycles.active(projectKey) })
    },
  })
}

export function useSetIssueCycle(projectKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ identifier, cycleId }: { identifier: string; cycleId: string | null }) =>
      setIssueCycle(projectKey, identifier, cycleId),
    onSuccess: (_data, { identifier, cycleId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.issues.all(projectKey) })
      // Refresh the open detail panel so the Cycle property updates immediately
      qc.invalidateQueries({ queryKey: queryKeys.issues.detail(identifier) })
      qc.invalidateQueries({ queryKey: queryKeys.cycles.active(projectKey) })
      if (cycleId) qc.invalidateQueries({ queryKey: queryKeys.cycles.detail(cycleId) })
    },
  })
}
