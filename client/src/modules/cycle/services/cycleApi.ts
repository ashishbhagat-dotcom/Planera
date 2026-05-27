import { apiClient } from '@/shared/lib/api'

export interface Cycle {
  id: string
  name: string
  description?: string
  status: 'upcoming' | 'active' | 'completed'
  start_date: string
  end_date: string
  progress: number
  created_at: string
  updated_at?: string
  issue_counts_by_status?: Record<string, number>
}

export interface CreateCyclePayload {
  name: string
  description?: string
  start_date: string
  end_date: string
}

export async function listCycles(projectKey: string): Promise<Cycle[]> {
  const res = await apiClient.get<Cycle[]>(`/projects/${projectKey}/cycles/`)
  return res.data
}

export async function getActiveCycle(projectKey: string): Promise<Cycle | null> {
  const res = await apiClient.get<Cycle | null>(`/projects/${projectKey}/cycles/active/`)
  return res.data
}

export async function getCycle(projectKey: string, cycleId: string): Promise<Cycle> {
  const res = await apiClient.get<Cycle>(`/projects/${projectKey}/cycles/${cycleId}/`)
  return res.data
}

export async function createCycle(projectKey: string, payload: CreateCyclePayload): Promise<Cycle> {
  const res = await apiClient.post<Cycle>(`/projects/${projectKey}/cycles/`, payload)
  return res.data
}

export async function patchCycle(projectKey: string, cycleId: string, payload: Partial<CreateCyclePayload>): Promise<Cycle> {
  const res = await apiClient.patch<Cycle>(`/projects/${projectKey}/cycles/${cycleId}/`, payload)
  return res.data
}

export async function setIssueCycle(projectKey: string, identifier: string, cycleId: string | null): Promise<void> {
  await apiClient.post(`/projects/${projectKey}/issues/${identifier}/set-cycle/`, { cycle_id: cycleId })
}
