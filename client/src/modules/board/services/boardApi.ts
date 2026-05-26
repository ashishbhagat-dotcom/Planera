import { issueApi, type IssueFilters } from '@/modules/issue/services/issueApi'
import type { Issue } from '@/shared/types/models'

export const boardApi = {
  getIssues: (projectKey: string, filters: IssueFilters = {}): Promise<Issue[]> =>
    issueApi.list(projectKey, { ...filters, ordering: 'position' }),
}
