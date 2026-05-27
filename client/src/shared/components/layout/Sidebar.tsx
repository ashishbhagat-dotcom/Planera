import { NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  ListTodo,
  Settings,
  Bell,
  PanelLeft,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useUiStore } from '@/shared/stores/uiStore'
import { WorkspaceSwitcher } from '@/modules/workspace/components/WorkspaceSwitcher'
import { useWorkspaces } from '@/modules/workspace/hooks/useWorkspace'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'

interface NavItem {
  label: string
  icon: React.ReactNode
  to: string
  end?: boolean
}

function SidebarNavLink({ to, icon, label, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] font-medium'
            : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        )
      }
    >
      <span className="size-4 shrink-0">{icon}</span>
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { key } = useParams<{ key?: string }>()
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const toggleNotificationPanel = useUiStore((s) => s.toggleNotificationPanel)
  const { darkMode, toggleDarkMode } = useUiStore()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  useWorkspaces() // hydrates workspaceStore on mount
  const { data: notifData } = useNotifications()
  const unreadCount = notifData?.unread_count ?? 0

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const projectLinks: NavItem[] = key
    ? [
        {
          label: 'Board',
          icon: <FolderKanban size={16} />,
          to: `/app/projects/${key}/board`,
        },
        {
          label: 'Issues',
          icon: <ListTodo size={16} />,
          to: `/app/projects/${key}/issues`,
        },
      ]
    : []

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      {/* Header */}
      <div className="flex h-12 items-center border-b border-[var(--border)]">
        <div className="flex-1 min-w-0">
          <WorkspaceSwitcher />
        </div>
        <button
          onClick={toggleSidebar}
          className="mr-2 shrink-0 rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Collapse sidebar"
        >
          <PanelLeft size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        <SidebarNavLink
          to="/app/dashboard"
          icon={<LayoutDashboard size={16} />}
          label="Dashboard"
        />
        <SidebarNavLink
          to="/app/projects"
          icon={<Layers size={16} />}
          label="Projects"
        />

        {projectLinks.length > 0 && (
          <div className="mt-3">
            <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Project
            </p>
            {projectLinks.map((item) => (
              <SidebarNavLink key={item.to} {...item} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-0.5 border-t border-[var(--border)] p-2">
        <button
          onClick={toggleNotificationPanel}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          <span className="relative size-4 shrink-0">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          Notifications
        </button>
        <SidebarNavLink
          to="/app/settings"
          icon={<Settings size={16} />}
          label="Settings"
        />
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
          {darkMode ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-red-400"
          title={user?.email}
        >
          <LogOut size={16} className="shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  )
}
