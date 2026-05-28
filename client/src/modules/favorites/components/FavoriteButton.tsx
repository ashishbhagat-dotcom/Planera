import { Star } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useIsFavorited, useToggleFavorite } from '../hooks/useFavorites'

interface Props {
  targetType: 'project' | 'issue'
  targetId: string
  className?: string
  size?: number
}

export function FavoriteButton({ targetType, targetId, className, size = 14 }: Props) {
  const favorited = useIsFavorited(targetType, targetId)
  const { toggle, isPending } = useToggleFavorite()

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(targetType, targetId) }}
      disabled={isPending}
      data-favorited={favorited ? 'true' : 'false'}
      className={cn(
        'rounded p-1 transition-colors disabled:opacity-50',
        favorited
          ? 'text-yellow-400 hover:text-yellow-300'
          : 'text-[var(--text-muted)] hover:text-yellow-400',
        className,
      )}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star size={size} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  )
}
