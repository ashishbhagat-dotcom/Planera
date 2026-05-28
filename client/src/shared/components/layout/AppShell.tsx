import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { PanelLeft, LogOut, ChevronDown } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BreadcrumbNav } from './BreadcrumbNav'
import { CommandPalette } from './CommandPalette'
import { IssueDetailPanel } from '@/modules/issue/components/IssueDetailPanel'
import { NotificationPanel } from '@/modules/notifications/components/NotificationPanel'
import { BulkActionBar } from '@/shared/components/ui/BulkActionBar'
import { useUiStore } from '@/shared/stores/uiStore'
import { useSelectionStore } from '@/shared/stores/selectionStore'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useWorkspaces, useCurrentWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { Avatar } from '@/shared/components/ui/Avatar'
import { DropdownMenu } from '@/shared/components/ui/DropdownMenu'
import { cn } from '@/shared/lib/utils'

function UserProfileButton() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-[var(--surface-hover)]">
          <Avatar
            src={user?.avatar_url}
            name={user?.full_name || user?.email}
            size="sm"
            className="!h-6 !w-6 shrink-0"
          />
          <div className="hidden max-w-[120px] text-left sm:block">
            <p className="truncate text-xs font-medium text-[var(--text-primary)]">
              {user?.full_name || 'My Account'}
            </p>
          </div>
          <ChevronDown size={13} className="shrink-0 text-[var(--text-muted)]" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="right" className="w-60">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar
            src={user?.avatar_url}
            name={user?.full_name || user?.email}
            size="lg"
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {user?.full_name || 'My Account'}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">{user?.email}</p>
          </div>
        </div>
        <DropdownMenu.Separator />
        <DropdownMenu.Item destructive onClick={handleLogout}>
          <LogOut size={14} />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

export function AppShell() {
  const { sidebarOpen, setSidebarOpen, toggleCommandPalette } = useUiStore()
  const { clear: clearSelection } = useSelectionStore()
  const location = useLocation()

  useKeyboardShortcut('k', toggleCommandPalette, { meta: true })

  // Clear selection on route change
  useEffect(() => { clearSelection() }, [location.pathname, clearSelection])

  // Ensure workspace is selected before rendering any workspace-scoped routes.
  // useWorkspaces auto-selects the first workspace; persist middleware makes
  // currentWorkspace available immediately on refresh if previously saved.
  const { isLoading: workspacesLoading } = useWorkspaces()
  const currentWorkspace = useCurrentWorkspace()
  const workspaceReady = !!currentWorkspace || !workspacesLoading

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {sidebarOpen && <Sidebar />}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            'flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] pr-3',
            !sidebarOpen && 'pl-3',
          )}
        >
          <div className="flex items-center">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-2 rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Expand sidebar"
              >
                <PanelLeft size={16} />
              </button>
            )}
            <BreadcrumbNav />
          </div>

          <UserProfileButton />
        </header>

        <main className="flex-1 overflow-auto">
          {workspaceReady ? <Outlet /> : (
            <div className="flex h-full items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            </div>
          )}
        </main>
      </div>

      <IssueDetailPanel />
      <CommandPalette />
      <NotificationPanel />
      <BulkActionBar />
    </div>
  )
}
