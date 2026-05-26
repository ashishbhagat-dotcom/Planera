import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { projectApi, type CreateProjectData } from '../services/projectApi'
import { useCurrentWorkspace } from '@/modules/workspace/hooks/useWorkspace'

export function useProjects() {
  const workspace = useCurrentWorkspace()

  return useQuery({
    queryKey: queryKeys.projects.all(workspace?.slug ?? ''),
    queryFn: projectApi.list,
    enabled: !!workspace,
  })
}

export function useProject(key: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(key),
    queryFn: () => projectApi.get(key),
    enabled: !!key,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const workspace = useCurrentWorkspace()

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspace?.slug ?? '') })
    },
  })
}
