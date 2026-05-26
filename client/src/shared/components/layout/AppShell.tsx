import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BreadcrumbNav } from './BreadcrumbNav'
import { useUiStore } from '@/shared/stores/uiStore'
import { cn } from '@/shared/lib/utils'
import { PanelLeft } from 'lucide-react'

export function AppShell() {
  const { sidebarOpen, setSidebarOpen } = useUiStore()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      {sidebarOpen && <Sidebar />}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            'flex h-12 shrink-0 items-center border-b border-[var(--border)]',
            !sidebarOpen && 'px-3',
          )}
        >
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
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
