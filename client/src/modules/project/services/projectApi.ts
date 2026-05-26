import { apiClient } from '@/shared/lib/api'
import type { PaginatedResponse } from '@/shared/types/api'
import type { Project } from '@/shared/types/models'

export interface CreateProjectData {
  name: string
  key: string
  description?: string
  icon?: string
  color?: string
  lead_id?: string
}

export const projectApi = {
  list: async (): Promise<Project[]> => {
    const res = await apiClient.get<PaginatedResponse<Project>>('/projects/')
    return res.data.results
  },

  get: async (key: string): Promise<Project> => {
    const res = await apiClient.get<Project>(`/projects/${key}/`)
    return res.data
  },

  create: async (data: CreateProjectData): Promise<Project> => {
    const res = await apiClient.post<Project>('/projects/', data)
    return res.data
  },

  update: async (key: string, data: Partial<CreateProjectData>): Promise<Project> => {
    const res = await apiClient.patch<Project>(`/projects/${key}/`, data)
    return res.data
  },

  delete: async (key: string): Promise<void> => {
    await apiClient.delete(`/projects/${key}/`)
  },
}
