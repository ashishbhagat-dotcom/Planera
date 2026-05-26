import { create } from 'zustand'
import type { User } from '@/shared/types/models'
import { setAccessToken } from '@/shared/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true on mount until session check completes

  setAuth: (user, accessToken) => {
    setAccessToken(accessToken)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  clearAuth: () => {
    setAccessToken(null)
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
