import { apiClient } from '@/shared/lib/api'
import type { User } from '@/shared/types/models'

interface AuthResponse {
  user: User
  access: string
}

export async function register(payload: {
  email: string
  full_name: string
  password: string
}): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register/', payload)
  return res.data
}

export async function login(payload: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login/', payload)
  return res.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout/')
}

export async function refreshToken(): Promise<{ access: string }> {
  const res = await apiClient.post<{ access: string }>('/auth/refresh/')
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/auth/me/')
  return res.data
}
