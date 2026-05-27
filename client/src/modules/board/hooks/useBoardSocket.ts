import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { WebSocketManager } from '@/shared/lib/ws'
import { getAccessToken } from '@/shared/lib/api'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import { queryKeys } from '@/shared/lib/queryClient'
import type { Issue } from '@/shared/types/models'
import type { IssueStatus } from '@/shared/types/enums'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'

export function useBoardSocket(projectKey: string) {
  const qc = useQueryClient()
  const wsRef = useRef<WebSocketManager | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!projectKey || !isAuthenticated) return

    const token = getAccessToken()
    if (!token) return

    const url = `${WS_BASE}/ws/board/${projectKey}/?token=${token}`
    const ws = new WebSocketManager(url)
    wsRef.current = ws

    ws.subscribe('issue.moved', (msg) => {
      const { identifier, status, position } = msg as {
        identifier: string
        status: IssueStatus
        position: string
      }
      qc.setQueriesData<Issue[]>(
        { queryKey: ['issues', projectKey] },
        (issues) => {
          if (!Array.isArray(issues)) return issues
          return issues.map((i) =>
            i.identifier === identifier ? { ...i, status, position } : i,
          )
        },
      )
    })

    ws.subscribe('issue.created', () => {
      qc.invalidateQueries({ queryKey: ['issues', projectKey] })
    })

    ws.subscribe('issue.deleted', (msg) => {
      const { identifier } = msg as { identifier: string }
      qc.setQueriesData<Issue[]>(
        { queryKey: ['issues', projectKey] },
        (issues) => {
          if (!Array.isArray(issues)) return issues
          return issues.filter((i) => i.identifier !== identifier)
        },
      )
    })

    ws.subscribe('issue.updated', (msg) => {
      const { identifier } = msg as { identifier: string }
      qc.invalidateQueries({ queryKey: ['issues', projectKey] })
      qc.invalidateQueries({ queryKey: queryKeys.issues.detail(identifier) })
    })

    ws.subscribe('comment.created', (msg) => {
      const { identifier } = msg as { identifier: string }
      qc.invalidateQueries({ queryKey: queryKeys.issues.comments(identifier) })
    })

    ws.connect()

    return () => ws.disconnect()
  }, [projectKey, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps
}
