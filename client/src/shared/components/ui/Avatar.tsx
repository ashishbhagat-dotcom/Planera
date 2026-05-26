import { cn } from '@/shared/lib/utils'

const sizes = {
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-7 w-7 text-xs',
  lg: 'h-9 w-9 text-sm',
}

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: keyof typeof sizes
  className?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-[--accent] font-medium text-white',
        sizes[size],
        className
      )}
      aria-label={name ?? 'User'}
    >
      {name ? getInitials(name) : '?'}
    </div>
  )
}

export { Avatar }
export type { AvatarProps }
