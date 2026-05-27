import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { login } from '../services/authApi'
import { useAuthStore } from '../stores/authStore'
import { ApiError } from '@/shared/types/api'
import { cn } from '@/shared/lib/utils'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, access } = await login({ email, password })
      setAuth(user, access)
      navigate('/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      {/* Subtle radial glow behind card */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[var(--accent)]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3z" />
              <path d="M14 3h7v7h-7z" />
              <path d="M3 14h7v7H3z" />
              <circle cx="17.5" cy="17.5" r="3.5" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Planera</span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-black/5 dark:shadow-black/30">
          <h1 className="mb-1 text-xl font-semibold text-[var(--text-primary)]">Welcome back</h1>
          <p className="mb-6 text-sm text-[var(--text-muted)]">Sign in to your Planera account</p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  'w-full rounded-lg border border-[var(--border)] bg-[var(--background)]',
                  'px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]',
                  'outline-none transition-colors',
                  'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20',
                )}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border border-[var(--border)] bg-[var(--background)]',
                    'py-2.5 pl-3.5 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]',
                    'outline-none transition-colors',
                    'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20',
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'mt-1 flex w-full items-center justify-center gap-2 rounded-lg',
                'bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white',
                'transition-colors hover:bg-[var(--accent-hover)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
