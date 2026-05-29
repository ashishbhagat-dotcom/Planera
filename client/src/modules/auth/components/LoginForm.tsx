import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Kanban, Sparkles, Zap } from 'lucide-react'
import { login } from '../services/authApi'
import { useAuthStore } from '../stores/authStore'
import { ApiError } from '@/shared/types/api'
import { cn } from '@/shared/lib/utils'

const INPUT_CLS = cn(
  'w-full rounded-lg border border-white/10 bg-white/5',
  'px-3.5 py-2.5 text-sm text-white placeholder:text-white/25',
  'outline-none transition-colors',
  'focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20',
)

const PERKS = [
  { icon: <Kanban size={15} />, text: 'Boards, lists & cycles in one place' },
  { icon: <Sparkles size={15} />, text: 'AI that writes, estimates & plans' },
  { icon: <Zap size={15} />, text: 'Real-time sync across your whole team' },
]

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
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#080810]">
      {/* Left panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 bg-[#0a0a15] p-12 lg:flex lg:w-[45%]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-violet-600/8 blur-3xl" />
        </div>

        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3z" />
              <path d="M14 3h7v7h-7z" />
              <path d="M3 14h7v7H3z" />
              <circle cx="17.5" cy="17.5" r="3.5" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-white">Planera</span>
        </Link>

        <div className="relative">
          <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-white">
            Welcome back.<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Let's keep shipping.
            </span>
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-white/45">
            Your team is waiting. Sign in to see what's moved, what's blocked, and what ships today.
          </p>
          <div className="space-y-3">
            {PERKS.map((p) => (
              <div key={p.text} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                  {p.icon}
                </div>
                <span className="text-sm text-white/55">{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/20">© {new Date().getFullYear()} Planera</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h7v7H3z" />
                <path d="M14 3h7v7h-7z" />
                <path d="M3 14h7v7H3z" />
                <circle cx="17.5" cy="17.5" r="3.5" />
              </svg>
            </div>
            <span className="text-base font-semibold text-white">Planera</span>
          </Link>

          <h1 className="mb-1 text-2xl font-bold text-white">Sign in</h1>
          <p className="mb-8 text-sm text-white/40">Enter your credentials to access your workspace</p>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50">Email address</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLS}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-white/50">Password</label>
                <button type="button" tabIndex={-1} className="text-xs text-indigo-400/70 transition-colors hover:text-indigo-400">
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
                  className={cn(INPUT_CLS, 'pr-10')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/60"
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
                'mt-2 flex w-full items-center justify-center gap-2 rounded-lg',
                'bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white',
                'shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-400 hover:shadow-indigo-400/30',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#080810]',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/35">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-400 transition-colors hover:text-indigo-300">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
