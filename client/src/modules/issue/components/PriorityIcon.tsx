import { AlertCircle, ArrowUp, ArrowDown, Minus, MoreHorizontal } from 'lucide-react'
import { IssuePriority } from '@/shared/types/enums'
import { PRIORITY_LABELS } from '@/shared/lib/constants'

const ICON: Record<IssuePriority, React.ReactNode> = {
  [IssuePriority.URGENT]: <AlertCircle size={14} className="text-red-500" />,
  [IssuePriority.HIGH]:   <ArrowUp size={14} className="text-orange-400" />,
  [IssuePriority.MEDIUM]: <Minus size={14} className="text-yellow-400" />,
  [IssuePriority.LOW]:    <ArrowDown size={14} className="text-blue-400" />,
  [IssuePriority.NONE]:   <MoreHorizontal size={14} className="text-[var(--text-muted)]" />,
}

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  return (
    <span className="flex items-center gap-1.5">
      {ICON[priority]}
      <span>{PRIORITY_LABELS[priority]}</span>
    </span>
  )
}

export { ICON as PRIORITY_ICON }
