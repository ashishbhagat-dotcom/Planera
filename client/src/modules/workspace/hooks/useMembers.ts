import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { workspaceApi } from '../services/workspaceApi'
import { useCurrentWorkspace } from './useWorkspace'

export function useMembers() {
  const workspace = useCurrentWorkspace()

  return useQuery({
    queryKey: queryKeys.workspaces.members(workspace?.slug ?? ''),
    queryFn: () => workspaceApi.getMembers(workspace!.slug),
    enabled: !!workspace,
  })
}
