import { apiClient } from '@/shared/lib/api'
import type { Notification } from '@/shared/types/models'

interface NotificationListResponse {
  results: Notification[]
  unread_count: number
}

export const notifApi = {
  list: async (): Promise<NotificationListResponse> => {
    const res = await apiClient.get<NotificationListResponse>('/notifications/')
    return res.data
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-read/')
  },
}
