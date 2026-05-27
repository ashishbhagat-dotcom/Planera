import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useUiStore } from '@/shared/stores/uiStore'
import { useNotifications, useMarkAllRead } from '../hooks/useNotifications'
import { useNotificationSocket } from '../hooks/useNotificationSocket'
import { NotificationItem } from './NotificationItem'

export function NotificationPanel() {
  const open = useUiStore((s) => s.notificationPanelOpen)
  const togglePanel = useUiStore((s) => s.toggleNotificationPanel)

  const { data, isLoading } = useNotifications()
  const { mutate: markAllRead } = useMarkAllRead()

  useNotificationSocket()

  useEffect(() => {
    if (open && data?.unread_count) {
      markAllRead()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={togglePanel}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-screen w-80 flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-xl">
        <div className="flex h-12 items-center justify-between border-b border-[var(--border)] px-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h2>
          <button
            onClick={togglePanel}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">Loading…</p>
          )}
          {!isLoading && !data?.results.length && (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              You're all caught up
            </p>
          )}
          {data?.results.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      </div>
    </>
  )
}
