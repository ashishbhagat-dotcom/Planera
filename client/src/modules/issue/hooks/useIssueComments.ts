import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { queryKeys } from '@/shared/lib/queryClient'
import { issueApi } from '../services/issueApi'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import type { Comment } from '@/shared/types/models'

export function useIssueComments(projectKey: string, identifier: string) {
  return useQuery<Comment[]>({
    queryKey: queryKeys.issues.comments(identifier),
    queryFn: () => issueApi.listComments(projectKey, identifier),
    enabled: !!projectKey && !!identifier,
  })
}

export function useAddComment(projectKey: string, identifier: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: (body: string) => issueApi.addComment(projectKey, identifier, body),

    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.comments(identifier) })
      const snapshot = queryClient.getQueryData<Comment[]>(queryKeys.issues.comments(identifier))

      const optimistic: Comment = {
        id: `temp-${crypto.randomUUID()}`,
        author: user!,
        body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Comment[]>(queryKeys.issues.comments(identifier), (prev) => [
        ...(prev ?? []),
        optimistic,
      ])

      return { snapshot, tempId: optimistic.id }
    },

    onError: (_err, _body, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(queryKeys.issues.comments(identifier), ctx.snapshot)
      }
      toast.error('Failed to post comment')
    },

    onSuccess: (created, _body, ctx) => {
      queryClient.setQueryData<Comment[]>(queryKeys.issues.comments(identifier), (prev) =>
        (prev ?? []).map((c) => (c.id === ctx?.tempId ? created : c)),
      )
    },
  })
}

export function useDeleteComment(projectKey: string, identifier: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) =>
      issueApi.deleteComment(projectKey, identifier, commentId),

    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.comments(identifier) })
      const snapshot = queryClient.getQueryData<Comment[]>(queryKeys.issues.comments(identifier))
      queryClient.setQueryData<Comment[]>(queryKeys.issues.comments(identifier), (prev) =>
        (prev ?? []).filter((c) => c.id !== commentId),
      )
      return { snapshot }
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(queryKeys.issues.comments(identifier), ctx.snapshot)
      }
      toast.error('Failed to delete comment')
    },
  })
}

export function useEditComment(projectKey: string, identifier: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      issueApi.updateComment(projectKey, identifier, commentId, body),

    onSuccess: (updated) => {
      queryClient.setQueryData<Comment[]>(queryKeys.issues.comments(identifier), (prev) =>
        (prev ?? []).map((c) => (c.id === updated.id ? updated : c)),
      )
    },

    onError: () => {
      toast.error('Failed to update comment')
    },
  })
}
