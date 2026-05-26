import { useEffect } from 'react'
import { refreshToken, getMe } from '../services/authApi'
import { useAuthStore } from '../stores/authStore'
import { setAccessToken } from '@/shared/lib/api'

export function useSession() {
  const { setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    async function rehydrate() {
      try {
        const { access } = await refreshToken()
        // Set on axios before calling getMe() so the Bearer header is attached
        setAccessToken(access)
        const user = await getMe()
        setAuth(user, access)
      } catch {
        clearAuth()
      }
    }

    rehydrate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
