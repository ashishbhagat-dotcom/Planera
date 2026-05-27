import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { WebSocketManager } from '@/shared/lib/ws'
import { getAccessToken } from '@/shared/lib/api'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import { queryKeys } from '@/shared/lib/queryClient'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'

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

    ws.subscribe('notification.new', () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() })
    })

    ws.connect()
    return () => ws.disconnect()
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps
}
