import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginForm } from '@/modules/auth/components/LoginForm'
import { RegisterForm } from '@/modules/auth/components/RegisterForm'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { AuthProvider } from './providers/AuthProvider'
import { AppShell } from '@/shared/components/layout/AppShell'
import { ProjectList } from '@/modules/project/components/ProjectList'
import { IssueListView } from '@/modules/issue/components/IssueListView'
import { BoardView } from '@/modules/board/components/BoardView'
import { DashboardPage } from '@/modules/dashboard/components/DashboardPage'
import type { ReactNode } from 'react'

function PlaceholderPage({ name }: { name: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{name}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Coming soon</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/app" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public routes — redirect to /app if already logged in */}
          <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />

          {/* Protected app routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:key/board" element={<BoardView />} />
            <Route path="projects/:key/issues" element={<IssueListView />} />
            <Route path="notifications" element={<PlaceholderPage name="Notifications" />} />
            <Route path="settings" element={<PlaceholderPage name="Settings" />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
