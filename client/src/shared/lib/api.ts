import axios, { type AxiosRequestConfig } from 'axios'
import { ApiError, type ApiErrorResponse } from '@/shared/types/api'
import { useWorkspaceStore } from '@/modules/workspace/stores/workspaceStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send cookies (refresh token)
})

// --- Token store (module-level, never persisted to localStorage) ---
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

// --- Refresh lock (prevents race condition on concurrent 401s) ---
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

async function refreshAccessToken(): Promise<string> {
  const res = await axios.post(
    `${BASE_URL}/auth/refresh/`,
    {},
    { withCredentials: true },
  )
  return res.data.access as string
}

// --- Request interceptor: attach Authorization + workspace slug ---
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }

  const slug = useWorkspaceStore.getState().currentWorkspace?.slug
  if (slug) {
    config.headers['X-Organization-Slug'] = slug
  }

  return config
})

// --- Response interceptor: silent refresh on 401 ---
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original: AxiosRequestConfig & { _retry?: boolean } = error.config

    const isAuthEndpoint = original.url?.includes('/auth/')
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((newToken) => {
            original.headers = {
              ...original.headers,
              Authorization: `Bearer ${newToken}`,
            }
            resolve(apiClient(original))
          })
        })
      }

      isRefreshing = true
      try {
        const newToken = await refreshAccessToken()
        setAccessToken(newToken)
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${newToken}`,
        }
        return apiClient(original)
      } catch {
        // Refresh failed — broadcast so AuthProvider clears state and ProtectedRoute redirects
        setAccessToken(null)
        refreshQueue = []
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // Transform error shape to ApiError
    const data = error.response?.data as ApiErrorResponse | undefined
    if (data?.error) {
      return Promise.reject(new ApiError(error.response.status, data.error))
    }

    return Promise.reject(error)
  },
)
