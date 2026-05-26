import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { issueApi, type CreateIssueData, type MoveIssueData, type UpdateIssueData } from '../services/issueApi'
import { queryKeys } from '@/shared/lib/queryClient'
import type { Issue } from '@/shared/types/models'

export function useMoveIssue(projectKey: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ identifier, ...data }: MoveIssueData & { identifier: string }) =>
      issueApi.move(projectKey, identifier, data),

    onMutate: async ({ identifier, status, position }) => {
      await qc.cancelQueries({ queryKey: ['issues', projectKey] })

      // Cache stores raw Issue[] (select in useBoardIssues only transforms the returned value)
      const snapshots = qc.getQueriesData<Issue[]>({ queryKey: ['issues', projectKey] })

      snapshots.forEach(([key, issues]) => {
        if (!issues) return
        qc.setQueryData<Issue[]>(
          key,
          issues.map((i) => (i.identifier === identifier ? { ...i, status, position } : i)),
        )
      })

      return { snapshots }
    },

    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.error('Failed to move issue')
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['issues', projectKey] })
    },
  })
}

export function useCreateIssue(projectKey: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIssueData) => issueApi.create(projectKey, data),

    onSuccess: () => {
      toast.success('Issue created')
      qc.invalidateQueries({ queryKey: ['issues', projectKey] })
    },

    onError: () => {
      toast.error('Failed to create issue')
    },
  })
}

export function useUpdateIssue(projectKey: string, identifier: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateIssueData) => issueApi.update(projectKey, identifier, data),

    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.issues.detail(identifier), updated)
      qc.invalidateQueries({ queryKey: ['issues', projectKey] })
      toast.success('Issue updated')
    },

    onError: () => {
      toast.error('Failed to update issue')
    },
  })
}

export function useDeleteIssue(projectKey: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (identifier: string) => issueApi.delete(projectKey, identifier),

    onMutate: async (identifier) => {
      await qc.cancelQueries({ queryKey: ['issues', projectKey] })

      const snapshots = qc.getQueriesData<Issue[]>({ queryKey: ['issues', projectKey] })

      snapshots.forEach(([key, issues]) => {
        if (!issues) return
        qc.setQueryData<Issue[]>(key, issues.filter((i) => i.identifier !== identifier))
      })

      return { snapshots }
    },

    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.error('Failed to delete issue')
    },

    onSuccess: () => {
      toast.success('Issue deleted')
      qc.invalidateQueries({ queryKey: ['issues', projectKey] })
    },
  })
}
