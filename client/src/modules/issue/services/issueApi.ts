import { apiClient } from '@/shared/lib/api'
import type { PaginatedResponse } from '@/shared/types/api'
import type { Activity, Comment, Issue, Label } from '@/shared/types/models'

export interface IssueFilters {
  status?: string
  priority?: string
  assignee_id?: string
  label?: string
  search?: string
  ordering?: string
  cycle?: string
}

export interface CreateIssueData {
  title: string
  description?: string
  status?: string
  priority?: string
  assignee_id?: string
  label_ids?: string[]
  due_date?: string
  estimate?: number
  parent_id?: string | null
}

export interface UpdateIssueData {
  title?: string
  description?: string
  status?: string
  priority?: string
  assignee_id?: string | null
  label_ids?: string[]
  due_date?: string | null
  estimate?: number | null
}

export interface MoveIssueData {
  status: string
  position: string
}

export const issueApi = {
  list: async (projectKey: string, filters: IssueFilters = {}): Promise<Issue[]> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
    )
    const res = await apiClient.get<PaginatedResponse<Issue>>(
      `/projects/${projectKey}/issues/`,
      { params },
    )
    return res.data.results
  },

  get: async (projectKey: string, identifier: string): Promise<Issue> => {
    const res = await apiClient.get<Issue>(`/projects/${projectKey}/issues/${identifier}/`)
    return res.data
  },

  create: async (projectKey: string, data: CreateIssueData): Promise<Issue> => {
    const res = await apiClient.post<Issue>(`/projects/${projectKey}/issues/`, data)
    return res.data
  },

  update: async (projectKey: string, identifier: string, data: UpdateIssueData): Promise<Issue> => {
    const res = await apiClient.patch<Issue>(`/projects/${projectKey}/issues/${identifier}/`, data)
    return res.data
  },

  delete: async (projectKey: string, identifier: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectKey}/issues/${identifier}/`)
  },

  move: async (projectKey: string, identifier: string, data: MoveIssueData): Promise<Issue> => {
    const res = await apiClient.post<Issue>(
      `/projects/${projectKey}/issues/${identifier}/move/`,
      data,
    )
    return res.data
  },

  listComments: async (projectKey: string, identifier: string): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>(
      `/projects/${projectKey}/issues/${identifier}/comments/`,
    )
    return res.data
  },

  addComment: async (projectKey: string, identifier: string, body: string): Promise<Comment> => {
    const res = await apiClient.post<Comment>(
      `/projects/${projectKey}/issues/${identifier}/comments/`,
      { body },
    )
    return res.data
  },

  updateComment: async (_projectKey: string, _identifier: string, commentId: string, body: string): Promise<Comment> => {
    const res = await apiClient.patch<Comment>(`/comments/${commentId}/`, { body })
    return res.data
  },

  deleteComment: async (_projectKey: string, _identifier: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}/`)
  },

  listActivity: async (projectKey: string, identifier: string): Promise<Activity[]> => {
    const res = await apiClient.get<Activity[]>(
      `/projects/${projectKey}/issues/${identifier}/activity/`,
    )
    return res.data
  },

  myIssues: async (filters: IssueFilters = {}): Promise<Issue[]> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
    )
    const res = await apiClient.get<PaginatedResponse<Issue>>('/me/issues/', { params })
    return res.data.results
  },

  search: async (q: string): Promise<Issue[]> => {
    const res = await apiClient.get<PaginatedResponse<Issue>>('/search/', { params: { q } })
    return res.data.results
  },

  listLabels: async (): Promise<Label[]> => {
    const res = await apiClient.get<PaginatedResponse<Label>>('/labels/')
    return res.data.results
  },
}
