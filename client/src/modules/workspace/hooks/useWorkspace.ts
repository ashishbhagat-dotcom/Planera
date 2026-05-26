import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { workspaceApi } from '../services/workspaceApi'
import { useWorkspaceStore } from '../stores/workspaceStore'

export function useWorkspaces() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

  const query = useQuery({
    queryKey: queryKeys.workspaces.all(),
    queryFn: workspaceApi.list,
  })

  // Auto-select first workspace on initial load
  useEffect(() => {
    if (!currentWorkspace && query.data && query.data.length > 0) {
      setCurrentWorkspace(query.data[0])
    }
  }, [query.data, currentWorkspace, setCurrentWorkspace])

  return query
}

export function useCurrentWorkspace() {
  return useWorkspaceStore((s) => s.currentWorkspace)
}
