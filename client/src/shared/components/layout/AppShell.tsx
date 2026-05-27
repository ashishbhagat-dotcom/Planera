import { useNavigate, Outlet } from 'react-router-dom'
import { PanelLeft, Settings, LogOut, ChevronDown } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BreadcrumbNav } from './BreadcrumbNav'
import { CommandPalette } from './CommandPalette'
import { IssueDetailPanel } from '@/modules/issue/components/IssueDetailPanel'
import { NotificationPanel } from '@/modules/notifications/components/NotificationPanel'
import { useUiStore } from '@/shared/stores/uiStore'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import { useAuth } from '@/modules/auth/hooks/useAuth'
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
        <DropdownMenu.Item onClick={() => navigate('/app/settings')}>
          <Settings size={14} />
          Settings
        </DropdownMenu.Item>
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
  useKeyboardShortcut('k', toggleCommandPalette, { meta: true })

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
          <Outlet />
        </main>
      </div>

      <IssueDetailPanel />
      <CommandPalette />
      <NotificationPanel />
    </div>
  )
}
