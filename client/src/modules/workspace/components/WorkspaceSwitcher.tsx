import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/shared/lib/utils'
import { useWorkspaces, useCurrentWorkspace } from '../hooks/useWorkspace'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useMyRole } from '../hooks/useMyRole'
import { workspaceApi } from '../services/workspaceApi'
import { queryKeys } from '@/shared/lib/queryClient'
import { MemberRole } from '@/shared/types/enums'
import type { Workspace } from '@/shared/types/models'

function WorkspaceAvatar({ workspace, size = 'md' }: { workspace: Workspace; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'size-5 text-xs' : 'size-7 text-sm'
  if (workspace.logo_url) {
    return <img src={workspace.logo_url} alt={workspace.name} className={cn('rounded object-cover', sz)} />
  }
  return (
    <span className={cn('flex items-center justify-center rounded bg-[var(--accent)] font-semibold text-white', sz)}>
      {workspace.name.charAt(0).toUpperCase()}
    </span>
  )
}

function CreateWorkspaceForm({ onCreated }: { onCreated: (ws: Workspace) => void }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: (ws) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() })
      onCreated(ws)
    },
  })

  function toSlug(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (name && slug) mutation.mutate({ name, slug }) }}
      className="p-3 space-y-2"
    >
      <p className="text-xs font-medium text-[var(--text-primary)]">Create a workspace</p>
      <input
        autoFocus
        placeholder="Workspace name"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      <input
        placeholder="URL slug (e.g. acme)"
        value={slug}
        onChange={(e) => { setSlug(toSlug(e.target.value)); setSlugEdited(true) }}
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      {mutation.isError && (
        <p className="text-xs text-red-500">
          {mutation.error instanceof Error ? mutation.error.message : 'Failed to create'}
        </p>
      )}
      <button
        type="submit"
        disabled={!name || !slug || mutation.isPending}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
      >
        {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
        Create
      </button>
    </form>
  )
}

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: workspaces = [], isLoading } = useWorkspaces()
  const current = useCurrentWorkspace()
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace)
  const myRole = useMyRole()
  const canCreateWorkspace = myRole !== MemberRole.MEMBER

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-10 items-center gap-2 px-3">
        <div className="size-7 animate-pulse rounded bg-[var(--surface-hover)]" />
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-hover)]" />
      </div>
    )
  }

  // No workspaces — show inline create prompt
  if (!current) {
    return (
      <div ref={ref} className="relative px-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--surface-hover)]"
        >
          <span className="flex size-7 items-center justify-center rounded border border-dashed border-[var(--border)] text-[var(--text-muted)]">
            <Plus size={14} />
          </span>
          <span className="flex-1 truncate text-left text-[var(--text-muted)]">No workspace</span>
        </button>
        {open && (
          <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg">
            <CreateWorkspaceForm
              onCreated={(ws) => { setCurrentWorkspace(ws); setOpen(false) }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative px-2">
      <button
        onClick={() => { setOpen((o) => !o); setCreating(false) }}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--surface-hover)]"
      >
        <WorkspaceAvatar workspace={current} />
        <span className="flex-1 truncate text-left font-medium text-[var(--text-primary)]">
          {current.name}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-[var(--text-muted)]" />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
          {!creating ? (
            <>
              <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Workspaces
              </p>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { setCurrentWorkspace(ws); setOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-[var(--surface-hover)]"
                >
                  <WorkspaceAvatar workspace={ws} size="sm" />
                  <span className="flex-1 truncate text-left text-[var(--text-primary)]">{ws.name}</span>
                  {ws.id === current.id && <Check size={14} className="text-[var(--accent)]" />}
                </button>
              ))}
              {canCreateWorkspace && (
                <>
                  <div className="my-1 border-t border-[var(--border)]" />
                  <button
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  >
                    <Plus size={14} />
                    Create workspace
                  </button>
                </>
              )}
            </>
          ) : (
            <CreateWorkspaceForm
              onCreated={(ws) => { setCurrentWorkspace(ws); setOpen(false); setCreating(false) }}
            />
          )}
        </div>
      )}
    </div>
  )
}
