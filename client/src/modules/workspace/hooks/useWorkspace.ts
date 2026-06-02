import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { workspaceApi } from '../services/workspaceApi'
import { useWorkspaceStore } from '../stores/workspaceStore'

export function useWorkspaces() {
  const { currentWorkspace, setCurrentWorkspace, clearWorkspace } = useWorkspaceStore()

  const query = useQuery({
    queryKey: queryKeys.workspaces.all(),
    queryFn: workspaceApi.list,
  })

  useEffect(() => {
    if (!query.data) return
    const slugs = query.data.map((w) => w.slug)
    if (currentWorkspace && !slugs.includes(currentWorkspace.slug)) {
      // Persisted workspace is no longer valid for this user — clear it
      clearWorkspace()
    }
    if (!currentWorkspace && query.data.length > 0) {
      setCurrentWorkspace(query.data[0])
    }
  }, [query.data, currentWorkspace, setCurrentWorkspace, clearWorkspace])

  return query
}

export function useCurrentWorkspace() {
  return useWorkspaceStore((s) => s.currentWorkspace)
}
