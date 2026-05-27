import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { issueApi, type CreateIssueData, type IssueFilters, type UpdateIssueData, type MoveIssueData } from '../services/issueApi'
import type { Label } from '@/shared/types/models'

export function useLabels() {
  return useQuery<Label[]>({
    queryKey: ['labels'],
    queryFn: () => issueApi.listLabels(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useIssues(projectKey: string, filters: IssueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.issues.all(projectKey, filters),
    queryFn: () => issueApi.list(projectKey, filters),
    enabled: !!projectKey,
  })
}

export function useIssue(projectKey: string, identifier: string) {
  return useQuery({
    queryKey: queryKeys.issues.detail(identifier),
    queryFn: () => issueApi.get(projectKey, identifier),
    enabled: !!projectKey && !!identifier,
  })
}

export function useCreateIssue(projectKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateIssueData) => issueApi.create(projectKey, data),
    onSuccess: (newIssue) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(projectKey) })
      // If this is a sub-issue, the parent's detail cache (sub_issues array) must refresh
      if (newIssue.parent_id) {
        queryClient.invalidateQueries({ queryKey: ['issues', 'detail'] })
      }
    },
  })
}

export function useUpdateIssue(projectKey: string, identifier: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateIssueData) => issueApi.update(projectKey, identifier, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.issues.detail(identifier), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(projectKey) })
    },
  })
}

export function useDeleteIssue(projectKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (identifier: string) => issueApi.delete(projectKey, identifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(projectKey) })
    },
  })
}

export function useMoveIssue(projectKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ identifier, ...data }: MoveIssueData & { identifier: string }) =>
      issueApi.move(projectKey, identifier, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(projectKey) })
    },
  })
}
