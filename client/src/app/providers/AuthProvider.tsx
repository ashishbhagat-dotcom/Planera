import { useEffect, type ReactNode } from 'react'
import { useSession } from '@/modules/auth/hooks/useSession'
import { useAuthStore } from '@/modules/auth/stores/authStore'

function SessionLoader() {
  useSession()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  // When the Axios interceptor fails to refresh (expired/invalid session),
  // it dispatches 'auth:logout' so we clear state here and ProtectedRoute redirects.
  useEffect(() => {
    const handler = () => clearAuth()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [clearAuth])

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
