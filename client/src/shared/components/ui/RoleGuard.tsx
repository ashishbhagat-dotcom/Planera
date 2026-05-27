import type { ReactNode } from 'react'
import { useMyRole } from '@/modules/workspace/hooks/useMyRole'
import type { MemberRole } from '@/shared/types/enums'

interface RoleGuardProps {
  roles: MemberRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const role = useMyRole()
  if (!role || !roles.includes(role)) return <>{fallback}</>
  return <>{children}</>
}
