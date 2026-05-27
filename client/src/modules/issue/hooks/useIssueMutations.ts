import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { issueApi, type CreateIssueData, type MoveIssueData, type UpdateIssueData } from '../services/issueApi'
import { queryKeys } from '@/shared/lib/queryClient'
import type { Issue } from '@/shared/types/models'
import type { IssueStatus } from '@/shared/types/enums'

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
          issues.map((i) => (i.identifier === identifier ? { ...i, status: status as IssueStatus, position } : i)),
        )
      })

      return { snapshots }
    },

    onError: (_err, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data))
      toast.error('Failed to move issue')
    },

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['issues', projectKey] })
      qc.invalidateQueries({ queryKey: queryKeys.issues.activity(vars.identifier) })
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

    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: queryKeys.issues.detail(identifier) })
      const snapshot = qc.getQueryData<Issue>(queryKeys.issues.detail(identifier))
      if (snapshot) {
        // Optimistically update scalar fields; relational fields (assignee, labels)
        // are corrected by onSuccess with the full server response.
        qc.setQueryData<Issue>(queryKeys.issues.detail(identifier), {
          ...snapshot,
          ...(data.status    !== undefined && { status: data.status as Issue['status'] }),
          ...(data.priority  !== undefined && { priority: data.priority as Issue['priority'] }),
          ...(data.title     !== undefined && { title: data.title }),
          ...(data.due_date  !== undefined && { due_date: data.due_date ?? null }),
          ...(data.estimate  !== undefined && { estimate: data.estimate ?? null }),
        })
      }
      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        qc.setQueryData(queryKeys.issues.detail(identifier), context.snapshot)
      }
      toast.error('Failed to update issue')
    },

    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.issues.detail(identifier), updated)
      qc.invalidateQueries({ queryKey: ['issues', projectKey] })
      qc.invalidateQueries({ queryKey: queryKeys.issues.activity(identifier) })
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
