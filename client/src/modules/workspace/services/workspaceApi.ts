import { apiClient } from '@/shared/lib/api'
import type { PaginatedResponse } from '@/shared/types/api'
import type { Membership, Workspace } from '@/shared/types/models'

export const workspaceApi = {
  list: async (): Promise<Workspace[]> => {
    const res = await apiClient.get<PaginatedResponse<Workspace>>('/workspaces/')
    return res.data.results
  },

  get: async (slug: string): Promise<Workspace> => {
    const res = await apiClient.get<Workspace>(`/workspaces/${slug}/`)
    return res.data
  },

  create: async (data: { name: string; slug: string }): Promise<Workspace> => {
    const res = await apiClient.post<Workspace>('/workspaces/', data)
    return res.data
  },

  update: async (slug: string, data: Partial<Pick<Workspace, 'name' | 'logo_url'>>): Promise<Workspace> => {
    const res = await apiClient.patch<Workspace>(`/workspaces/${slug}/`, data)
    return res.data
  },

  getMembers: async (slug: string): Promise<Membership[]> => {
    const res = await apiClient.get<PaginatedResponse<Membership>>(`/workspaces/${slug}/members/`)
    return res.data.results
  },

  inviteMember: async (slug: string, data: { email: string; role: string }): Promise<Membership> => {
    const res = await apiClient.post<Membership>(`/workspaces/${slug}/invite/`, data)
    return res.data
  },

  updateMemberRole: async (membershipId: string, role: string): Promise<Membership> => {
    const res = await apiClient.patch<Membership>(`/workspaces/memberships/${membershipId}/`, { role })
    return res.data
  },

  removeMember: async (membershipId: string): Promise<void> => {
    await apiClient.delete(`/workspaces/memberships/${membershipId}/`)
  },
}
