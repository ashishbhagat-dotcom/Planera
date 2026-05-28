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
    mutationFn: async (body: string) => {
      try {
        return await issueApi.addComment(projectKey, identifier, body)
      } catch (e) {
        console.error('[comment] mutationFn threw:', e)
        throw e
      }
    },

    onMutate: async (body: string) => {
      console.log('[comment] onMutate start — projectKey:', projectKey, 'identifier:', identifier, 'user:', user)
      try {
        await queryClient.cancelQueries({ queryKey: queryKeys.issues.comments(identifier) })
        const snapshot = queryClient.getQueryData<Comment[]>(queryKeys.issues.comments(identifier))

        const optimistic: Comment = {
          id: `temp-${Date.now().toString()}`,
          author: user ?? { id: '', email: '', full_name: 'You', avatar_url: '', created_at: '' },
          body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        queryClient.setQueryData<Comment[]>(queryKeys.issues.comments(identifier), (prev) => [
          ...(prev ?? []),
          optimistic,
        ])

        console.log('[comment] onMutate done, optimistic id:', optimistic.id)
        return { snapshot, tempId: optimistic.id }
      } catch (e) {
        console.error('[comment] onMutate threw:', e)
        throw e
      }
    },

    onError: (err: unknown, _body, ctx) => {
      console.error('[comment] onError:', err)
      if (ctx?.snapshot !== undefined) {
        queryClient.setQueryData(queryKeys.issues.comments(identifier), ctx.snapshot)
      }
      const status = (err as { status?: number })?.status
      const msg = (err as { error?: { message?: string } })?.error?.message
      toast.error(`Failed to post comment${status ? ` (${status})` : ''}${msg ? `: ${msg}` : ''}`)
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
