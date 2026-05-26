import type { ReactNode } from 'react'
import { useSession } from '@/modules/auth/hooks/useSession'
import { useAuthStore } from '@/modules/auth/stores/authStore'

function SessionLoader() {
  useSession()
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading)

  return (
    <>
      <SessionLoader />
      {isLoading ? (
        <div className="flex h-screen items-center justify-center bg-[var(--background)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        </div>
      ) : (
        children
      )}
    </>
  )
}
