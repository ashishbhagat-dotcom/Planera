import { useAuthStore } from '../stores/authStore'
import { logout as apiLogout } from '../services/authApi'

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth } = useAuthStore()

  async function logout() {
    try {
      await apiLogout()
    } catch {
      // ignore — clear locally regardless
    }
    clearAuth()
  }

  return { user, isAuthenticated, isLoading, setAuth, logout }
}
