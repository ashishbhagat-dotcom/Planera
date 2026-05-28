import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryClient'
import { favoritesApi } from '../services/favoritesApi'

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites.all(),
    queryFn: favoritesApi.list,
  })
}

export function useIsFavorited(targetType: 'project' | 'issue', targetId: string) {
  const { data: favorites = [] } = useFavorites()
  return favorites.find((f) => f.target_type === targetType && f.target_id === targetId)
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  const { data: favorites = [] } = useFavorites()

  const add = useMutation({
    mutationFn: ({ targetType, targetId }: { targetType: 'project' | 'issue'; targetId: string }) =>
      favoritesApi.add(targetType, targetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites.all() }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => favoritesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites.all() }),
  })

  function toggle(targetType: 'project' | 'issue', targetId: string) {
    const existing = favorites.find(
      (f) => f.target_type === targetType && f.target_id === targetId,
    )
    if (existing) {
      remove.mutate(existing.id)
    } else {
      add.mutate({ targetType, targetId })
    }
  }

  return { toggle, isPending: add.isPending || remove.isPending }
}
