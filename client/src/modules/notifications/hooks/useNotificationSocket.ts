import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { WebSocketManager } from '@/shared/lib/ws'
import { getAccessToken } from '@/shared/lib/api'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import { queryKeys } from '@/shared/lib/queryClient'

const WS_BASE = import.meta.env.VITE_WS_URL ??
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

const TOAST_TYPES: Record<string, string> = {
  'issue.assigned': '🔔',
  'issue.unassigned': '🔕',
  'comment.created': '💬',
}

export function useNotificationSocket() {
  const qc = useQueryClient()
  const wsRef = useRef<WebSocketManager | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return

    const token = getAccessToken()
    if (!token) return

    const url = `${WS_BASE}/ws/notifications/?token=${token}`
    const ws = new WebSocketManager(url)
    wsRef.current = ws

    ws.subscribe('notification.new', (msg) => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() })
      const notifType = msg.notif_type as string | undefined
      const title = msg.title as string | undefined
      if (title) {
        const icon = (notifType && TOAST_TYPES[notifType]) ?? '🔔'
        toast(title, { icon, duration: 4000 })
      }
    })

    ws.connect()
    return () => ws.disconnect()
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps
}
