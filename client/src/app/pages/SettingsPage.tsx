import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, Users, Check, Loader2, Trash2,
  ShieldCheck, Shield, UserCircle, Crown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/shared/lib/utils'
import { queryKeys } from '@/shared/lib/queryClient'
import { apiClient, getAccessToken } from '@/shared/lib/api'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import { useCurrentWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { useMembers } from '@/modules/workspace/hooks/useMembers'
import { useMyRole } from '@/modules/workspace/hooks/useMyRole'
import { workspaceApi } from '@/modules/workspace/services/workspaceApi'
import { useWorkspaceStore } from '@/modules/workspace/stores/workspaceStore'
import { Avatar } from '@/shared/components/ui/Avatar'
import { MemberRole } from '@/shared/types/enums'
import type { User as UserType } from '@/shared/types/models'

// ─── helpers ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<MemberRole, string> = {
  [MemberRole.OWNER]:  'Owner',
  [MemberRole.ADMIN]:  'Admin',
  [MemberRole.MEMBER]: 'Member',
}

const ROLE_ICON: Record<MemberRole, React.ReactNode> = {
  [MemberRole.OWNER]:  <Crown size={13} className="text-yellow-500" />,
  [MemberRole.ADMIN]:  <ShieldCheck size={13} className="text-blue-500" />,
  [MemberRole.MEMBER]: <Shield size={13} className="text-[var(--text-muted)]" />,
}

function SectionCard({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-6 py-4">
        <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function FieldRow({ label, hint, children }: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_2fr] items-start gap-6">
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function inputCn(extra = '') {
  return cn(
    'w-full rounded-lg border border-[var(--border)] bg-[var(--background)]',
    'px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]',
    'outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20',
    extra,
  )
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
        'bg-[var(--accent)] hover:bg-[var(--accent-hover)]',
        'disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
      {loading ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
    </button>
  )
}

// ─── Profile tab ────────────────────────────────────────────────────────────

function ProfileSettings() {
  const { user, setAuth } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '')
  const [saved, setSaved] = useState(false)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { full_name?: string; avatar_url?: string }) =>
      apiClient.patch<UserType>('/auth/me/', data).then((r) => r.data),
    onSuccess: (updated) => {
      const token = getAccessToken() ?? ''
      setAuth(updated, token)
      qc.setQueryData(queryKeys.auth.me(), updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    onError: () => toast.error('Failed to save profile'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({ full_name: fullName, avatar_url: avatarUrl || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard title="Public profile" description="Your name and avatar are visible to all workspace members.">
        <div className="space-y-5">
          <FieldRow label="Avatar" hint="URL of your profile picture">
            <div className="flex items-center gap-4">
              <Avatar src={avatarUrl || null} name={fullName || user?.email} size="lg" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className={inputCn('flex-1')}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </FieldRow>

          <div className="border-t border-[var(--border)]" />

          <FieldRow label="Full name">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCn()}
              placeholder="Your full name"
            />
          </FieldRow>

          <FieldRow label="Email" hint="Email cannot be changed">
            <input
              type="email"
              disabled
              value={user?.email ?? ''}
              className={inputCn('cursor-not-allowed opacity-50')}
            />
          </FieldRow>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton loading={mutation.isPending} saved={saved} />
      </div>
    </form>
  )
}

// ─── Workspace tab ───────────────────────────────────────────────────────────

function WorkspaceSettings() {
  const workspace = useCurrentWorkspace()
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace)
  const qc = useQueryClient()
  const [name, setName] = useState(workspace?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(workspace?.logo_url ?? '')
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: { name?: string; logo_url?: string }) =>
      workspaceApi.update(workspace!.slug, data),
    onSuccess: (updated) => {
      setCurrentWorkspace(updated)
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.all() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    onError: () => toast.error('Failed to update workspace'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({ name, logo_url: logoUrl || undefined })
  }

  if (!workspace) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard title="Workspace details" description="Update your workspace name and logo.">
        <div className="space-y-5">
          <FieldRow label="Logo" hint="URL of your workspace logo">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  workspace.name.charAt(0).toUpperCase()
                )}
              </div>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className={inputCn('flex-1')}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </FieldRow>

          <div className="border-t border-[var(--border)]" />

          <FieldRow label="Workspace name">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCn()}
              placeholder="My Workspace"
            />
          </FieldRow>

          <FieldRow label="URL slug" hint="Cannot be changed after creation">
            <input
              type="text"
              disabled
              value={workspace.slug}
              className={inputCn('cursor-not-allowed font-mono opacity-50')}
            />
          </FieldRow>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton loading={mutation.isPending} saved={saved} />
      </div>
    </form>
  )
}

// ─── Members tab ─────────────────────────────────────────────────────────────

function MembersSettings() {
  const workspace = useCurrentWorkspace()
  const myRole = useMyRole()
  const { data: members = [], isLoading } = useMembers()
  const qc = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>(MemberRole.MEMBER)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const canManage = myRole === MemberRole.OWNER || myRole === MemberRole.ADMIN
  const isOwner   = myRole === MemberRole.OWNER

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.workspaces.members(workspace?.slug ?? '') })

  const inviteMutation = useMutation({
    mutationFn: () => workspaceApi.inviteMember(workspace!.slug, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      setInviteEmail('')
      invalidate()
      toast.success('Invitation sent')
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? 'Failed to invite member'
      toast.error(msg)
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      workspaceApi.updateMemberRole(id, role),
    onSuccess: () => { invalidate(); toast.success('Role updated') },
    onError: () => toast.error('Failed to update role'),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => workspaceApi.removeMember(id),
    onSuccess: () => { setRemovingId(null); invalidate(); toast.success('Member removed') },
    onError: () => { setRemovingId(null); toast.error('Failed to remove member') },
  })

  return (
    <div className="space-y-6">
      {/* Invite form — admin/owner only */}
      {canManage && (
        <SectionCard title="Invite member" description="Add someone to this workspace by email.">
          <form
            onSubmit={(e) => { e.preventDefault(); inviteMutation.mutate() }}
            className="flex items-end gap-3"
          >
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Email address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className={inputCn()}
                placeholder="colleague@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                className={inputCn('w-32')}
              >
                {isOwner && <option value={MemberRole.ADMIN}>Admin</option>}
                <option value={MemberRole.MEMBER}>Member</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {inviteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Invite
            </button>
          </form>
        </SectionCard>
      )}

      {/* Member list */}
      <SectionCard
        title={`Members (${members.length})`}
        description="Everyone with access to this workspace."
      >
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface-hover)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 animate-pulse rounded bg-[var(--surface-hover)]" />
                  <div className="h-2.5 w-48 animate-pulse rounded bg-[var(--surface-hover)]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {members.map((m) => {
              const isMe = m.user.id === useAuthStore.getState().user?.id
              const isThisOwner = m.role === MemberRole.OWNER
              return (
                <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar src={m.user.avatar_url} name={m.user.full_name || m.user.email} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {m.user.full_name || m.user.email}
                      {isMe && <span className="ml-1.5 text-xs text-[var(--text-muted)]">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{m.user.email}</p>
                  </div>

                  {/* Role badge / selector */}
                  {canManage && !isThisOwner && !isMe ? (
                    <select
                      value={m.role}
                      disabled={roleMutation.isPending}
                      onChange={(e) => roleMutation.mutate({ id: m.id, role: e.target.value })}
                      className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
                    >
                      {isOwner && <option value={MemberRole.ADMIN}>Admin</option>}
                      <option value={MemberRole.MEMBER}>Member</option>
                    </select>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                      {ROLE_ICON[m.role as MemberRole]}
                      {ROLE_LABEL[m.role as MemberRole]}
                    </span>
                  )}

                  {/* Remove button — can't remove owner or yourself */}
                  {canManage && !isThisOwner && !isMe && (
                    removingId === m.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeMutation.mutate(m.id)}
                          disabled={removeMutation.isPending}
                          className="rounded px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                        >
                          {removeMutation.isPending ? 'Removing…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setRemovingId(null)}
                          className="rounded px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRemovingId(m.id)}
                        className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-red-500"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}

// ─── Page shell ──────────────────────────────────────────────────────────────

type Tab = 'profile' | 'workspace' | 'members'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile',   label: 'Profile',   icon: <UserCircle size={16} /> },
  { id: 'workspace', label: 'Workspace', icon: <Building2  size={16} /> },
  { id: 'members',   label: 'Members',   icon: <Users      size={16} /> },
]

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const myRole = useMyRole()

  const visibleTabs = TABS.filter((t) => {
    if (t.id === 'workspace') return myRole === MemberRole.OWNER
    return true
  })

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
          Manage your profile, workspace, and team.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Left nav */}
        <nav className="w-44 shrink-0">
          <ul className="space-y-0.5">
            {visibleTabs.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    tab === t.id
                      ? 'bg-[var(--surface-hover)] font-medium text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
                  )}
                >
                  <span className="shrink-0">{t.icon}</span>
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {tab === 'profile'   && <ProfileSettings />}
          {tab === 'workspace' && <WorkspaceSettings />}
          {tab === 'members'   && <MembersSettings />}
        </div>
      </div>
    </div>
  )
}
