import { apiClient } from '@/shared/lib/api'
import type { Activity } from '@/shared/types/models'

export interface DashboardStats {
  issue_counts_by_status: Record<string, number>
  issue_counts_by_priority: Record<string, number>
  open_issues: number
  overdue_count: number
  recent_activity: Activity[]
}

export const dashboardApi = {
  getStats(workspaceSlug: string, projectKey?: string): Promise<DashboardStats> {
    const params = projectKey ? { project_key: projectKey } : {}
    return apiClient
      .get<DashboardStats>('/analytics/dashboard/', { params })
      .then((r) => r.data)
  },
}
