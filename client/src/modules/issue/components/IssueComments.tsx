import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import { Avatar } from '@/shared/components/ui/Avatar'
import { useIssueComments, useAddComment, useDeleteComment, useEditComment } from '../hooks/useIssueComments'
import type { Comment } from '@/shared/types/models'

interface CommentItemProps {
  comment: Comment
  projectKey: string
  identifier: string
  isAuthor: boolean
}

function CommentItem({ comment, projectKey, identifier, isAuthor }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const isSending = comment.id.startsWith('temp-')

  const { mutate: deleteComment } = useDeleteComment(projectKey, identifier)
  const { mutate: editComment, isPending: isSaving } = useEditComment(projectKey, identifier)

  const handleSave = () => {
    if (!editBody.trim()) return
    editComment(
      { commentId: comment.id, body: editBody.trim() },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <div className={cn('flex gap-3', isSending && 'opacity-60')}>
      <Avatar
        name={comment.author?.full_name || comment.author?.email}
        src={comment.author?.avatar_url}
        size="sm"
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-xs font-medium text-[var(--text-primary)]">
            {comment.author?.full_name || comment.author?.email}
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            {isSending
              ? 'Sending…'
              : formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full resize-none rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              rows={3}
              autoFocus
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                disabled={isSaving || !editBody.trim()}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--accent)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                <Check size={12} /> Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditBody(comment.body) }}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group flex items-start gap-2">
            <p className="flex-1 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
              {comment.body}
            </p>
            {isAuthor && !isSending && (
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  aria-label="Edit comment"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-red-500"
                  aria-label="Delete comment"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface IssueCommentsProps {
  projectKey: string
  identifier: string
}

export function IssueComments({ projectKey, identifier }: IssueCommentsProps) {
  const [body, setBody] = useState('')
  const currentUser = useAuthStore((s) => s.user)

  const { data: comments = [], isLoading } = useIssueComments(projectKey, identifier)
  const { mutate: addComment, isPending } = useAddComment(projectKey, identifier)

  const handleSubmit = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    addComment(trimmed, { onSuccess: () => setBody('') })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-[var(--surface-hover)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-hover)]" />
              <div className="h-10 w-full animate-pulse rounded bg-[var(--surface-hover)]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--text-muted)]">No comments yet.</p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              projectKey={projectKey}
              identifier={identifier}
              isAuthor={comment.author?.id === currentUser?.id}
            />
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="flex gap-3 pt-2">
        <Avatar
          name={currentUser?.full_name || currentUser?.email}
          src={currentUser?.avatar_url}
          size="sm"
          className="mt-1 shrink-0"
        />
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Leave a comment… (⌘Enter to submit)"
            rows={3}
            className="w-full resize-none rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !body.trim()}
            className="mt-1.5 rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? 'Sending…' : 'Comment'}
          </button>
        </div>
      </div>
    </div>
  )
}
