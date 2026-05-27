import type { IssueStatus, IssuePriority, MemberRole } from './enums'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  logo_url: string
  created_at: string
}

export interface Membership {
  id: string
  user: User
  role: MemberRole
  created_at: string
}

export interface Project {
  id: string
  name: string
  key: string
  description: string
  icon: string
  color: string
  issue_count: number
  lead: User | null
  created_at: string
  updated_at: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface Issue {
  id: string
  identifier: string
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  position: string
  creator: User
  assignee: User | null
  labels: Label[]
  cycle_id: string | null
  due_date: string | null
  estimate: number | null
  project: string
  project_key?: string
  project_name?: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  author: User
  body: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  actor: User
  verb: string
  data: Record<string, unknown>
  created_at: string
}

export interface Notification {
  id: string
  type: string
  title: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}
