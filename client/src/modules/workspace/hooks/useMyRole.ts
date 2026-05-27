import { useAuthStore } from '@/modules/auth/stores/authStore'
import { MemberRole } from '@/shared/types/enums'
import { useMembers } from './useMembers'

export function useMyRole(): MemberRole | null {
  const userId = useAuthStore((s) => s.user?.id)
  const { data: members = [] } = useMembers()

  if (!userId) return null
  return members.find((m) => m.user.id === userId)?.role ?? null
}
