import { Circle, CircleDot, Timer, Eye, CheckCircle2, XCircle } from 'lucide-react'
import { IssueStatus } from '@/shared/types/enums'
import { STATUS_LABELS } from '@/shared/lib/constants'

const ICON: Record<IssueStatus, React.ReactNode> = {
  [IssueStatus.BACKLOG]:     <Circle size={14} className="text-[var(--text-muted)]" />,
  [IssueStatus.TODO]:        <CircleDot size={14} className="text-gray-400" />,
  [IssueStatus.IN_PROGRESS]: <Timer size={14} className="text-amber-400" />,
  [IssueStatus.IN_REVIEW]:   <Eye size={14} className="text-blue-400" />,
  [IssueStatus.DONE]:        <CheckCircle2 size={14} className="text-emerald-500" />,
  [IssueStatus.CANCELLED]:   <XCircle size={14} className="text-red-400" />,
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span className="flex items-center gap-1.5">
      {ICON[status]}
      <span>{STATUS_LABELS[status]}</span>
    </span>
  )
}

export { ICON as STATUS_ICON }
