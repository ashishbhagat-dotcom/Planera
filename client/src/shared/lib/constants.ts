import { IssueStatus, IssuePriority } from '@/shared/types/enums'

export const STATUS_LABELS: Record<IssueStatus, string> = {
  [IssueStatus.BACKLOG]: 'Backlog',
  [IssueStatus.TODO]: 'Todo',
  [IssueStatus.IN_PROGRESS]: 'In Progress',
  [IssueStatus.IN_REVIEW]: 'In Review',
  [IssueStatus.DONE]: 'Done',
  [IssueStatus.CANCELLED]: 'Cancelled',
}

export const STATUS_COLORS: Record<IssueStatus, string> = {
  [IssueStatus.BACKLOG]: 'var(--status-backlog)',
  [IssueStatus.TODO]: '#e5e7eb',
  [IssueStatus.IN_PROGRESS]: 'var(--status-in-progress)',
  [IssueStatus.IN_REVIEW]: 'var(--status-in-review)',
  [IssueStatus.DONE]: 'var(--status-done)',
  [IssueStatus.CANCELLED]: 'var(--status-cancelled)',
}

export const STATUS_ORDER: IssueStatus[] = [
  IssueStatus.BACKLOG,
  IssueStatus.TODO,
  IssueStatus.IN_PROGRESS,
  IssueStatus.IN_REVIEW,
  IssueStatus.DONE,
  IssueStatus.CANCELLED,
]

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  [IssuePriority.URGENT]: 'Urgent',
  [IssuePriority.HIGH]: 'High',
  [IssuePriority.MEDIUM]: 'Medium',
  [IssuePriority.LOW]: 'Low',
  [IssuePriority.NONE]: 'No priority',
}

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  [IssuePriority.URGENT]: 'var(--priority-urgent)',
  [IssuePriority.HIGH]: 'var(--priority-high)',
  [IssuePriority.MEDIUM]: 'var(--priority-medium)',
  [IssuePriority.LOW]: 'var(--priority-low)',
  [IssuePriority.NONE]: 'var(--priority-none)',
}

// Lucide icon names for priority (used in PriorityIcon component in T29)
export const PRIORITY_ICONS: Record<IssuePriority, string> = {
  [IssuePriority.URGENT]: 'AlertCircle',
  [IssuePriority.HIGH]: 'ArrowUp',
  [IssuePriority.MEDIUM]: 'Minus',
  [IssuePriority.LOW]: 'ArrowDown',
  [IssuePriority.NONE]: 'MoreHorizontal',
}
