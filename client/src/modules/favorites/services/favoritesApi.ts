import { apiClient as api } from '@/shared/lib/api'

export interface Favorite {
  id: string
  target_type: 'project' | 'issue'
  target_id: string
  target_name: string | null
  target_identifier: string | null
  created_at: string
}

export const favoritesApi = {
  list: (): Promise<Favorite[]> =>
    api.get('/favorites/').then((r) => r.data.results ?? r.data),

  add: (target_type: 'project' | 'issue', target_id: string): Promise<Favorite> =>
    api.post('/favorites/', { target_type, target_id }).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/favorites/${id}/`).then(() => undefined),
}
