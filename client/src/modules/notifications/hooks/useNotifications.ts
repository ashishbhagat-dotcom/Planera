import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { useCurrentWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { notifApi } from '../services/notifApi'

export function useNotifications() {
  const workspace = useCurrentWorkspace()
  return useQuery({
    queryKey: [...queryKeys.notifications.all(), workspace?.slug],
    queryFn: notifApi.list,
    enabled: !!workspace,
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  const workspace = useCurrentWorkspace()
  return useMutation({
    mutationFn: notifApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() })
    },
  })
}
