import { cn } from '@/shared/lib/utils'
import { type IssueStatus, type IssuePriority } from '@/shared/types/enums'

const statusStyles: Record<IssueStatus, string> = {
  backlog:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  todo:        'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_review:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  done:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled:   'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const priorityStyles: Record<IssuePriority, string> = {
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  high:   'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low:    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  none:   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

interface BadgeProps {
  children: React.ReactNode
  status?: IssueStatus
  priority?: IssuePriority
  className?: string
}

function Badge({ children, status, priority, className }: BadgeProps) {
  const colorClass = status
    ? statusStyles[status]
    : priority
    ? priorityStyles[priority]
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeProps }
