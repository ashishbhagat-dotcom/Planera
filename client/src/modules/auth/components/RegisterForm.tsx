import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Check, Mail, Kanban, Sparkles, Zap } from 'lucide-react'
import { sendOtp, verifyOtp } from '../services/authApi'
import { useAuthStore } from '../stores/authStore'
import { ApiError } from '@/shared/types/api'
import { cn } from '@/shared/lib/utils'

const INPUT_CLS = cn(
  'w-full rounded-lg border border-white/10 bg-white/5',
  'px-3.5 py-2.5 text-sm text-white placeholder:text-white/25',
  'outline-none transition-colors',
  'focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20',
)

const BTN_CLS = cn(
  'mt-2 flex w-full items-center justify-center gap-2 rounded-lg',
  'bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white',
  'shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-400 hover:shadow-indigo-400/30',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#080810]',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

const PERKS = [
  { icon: <Kanban size={15} />, text: 'Kanban boards & sprint cycles' },
  { icon: <Sparkles size={15} />, text: 'AI issue assistant built in' },
  { icon: <Zap size={15} />, text: 'Real-time collaboration' },
]

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: '', color: '' }
  const checks = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)]
  const score = checks.filter(Boolean).length
  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' }
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
}

function SidePanel() {
  return (
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
          Your team's new<br />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            home base.
          </span>
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-white/45">
          Free forever. No credit card. Set up your workspace in under 2 minutes and start shipping.
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
  )
}

export function RegisterForm() {
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const strength = passwordStrength(password)

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendOtp({ email, full_name: fullName, password })
      setStep('otp')
      startResendCooldown()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, access } = await verifyOtp({ email, otp_code: otp })
      setAuth(user, access)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await sendOtp({ email, full_name: fullName, password })
      startResendCooldown()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <div className="flex min-h-screen bg-[#080810]">
      <SidePanel />

      {/* Right panel */}
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

          {step === 'details' ? (
            <>
              <h1 className="mb-1 text-2xl font-bold text-white">Create your account</h1>
              <p className="mb-8 text-sm text-white/40">Free forever · No credit card required</p>

              {error && (
                <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-white/50">Full name</label>
                  <input type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={INPUT_CLS} placeholder="Jane Smith" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-white/50">Email address</label>
                  <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLS} placeholder="you@example.com" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-white/50">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(INPUT_CLS, 'pr-10')}
                      placeholder="Min. 8 characters"
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/60" aria-label="Toggle password">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= strength.score ? strength.color : 'bg-white/10')} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xs font-medium',
                          strength.score === 1 && 'text-red-400',
                          strength.score === 2 && 'text-yellow-400',
                          strength.score === 3 && 'text-blue-400',
                          strength.score === 4 && 'text-emerald-400',
                        )}>{strength.label}</span>
                        {strength.score === 4 && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <Check size={11} strokeWidth={3} /> Strong password
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} className={BTN_CLS}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                  {loading ? 'Sending code…' : 'Continue with email'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-white/25">
                By creating an account you agree to our{' '}
                <span className="cursor-default underline underline-offset-2">Terms</span> &{' '}
                <span className="cursor-default underline underline-offset-2">Privacy</span>.
              </p>
            </>
          ) : (
            <>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
                <Mail size={22} className="text-indigo-400" />
              </div>
              <h1 className="mb-1 text-2xl font-bold text-white">Check your inbox</h1>
              <p className="mb-8 text-sm text-white/40">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-white/70">{email}</span>
              </p>

              {error && (
                <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-white/50">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={cn(INPUT_CLS, 'text-center text-2xl tracking-[0.5em] font-mono')}
                    placeholder="000000"
                  />
                </div>

                <button type="submit" disabled={loading || otp.length !== 6} className={BTN_CLS}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {loading ? 'Verifying…' : 'Create account'}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between text-sm">
                <button onClick={() => { setStep('details'); setOtp(''); setError('') }} className="text-white/35 transition-colors hover:text-white/70">
                  ← Change email
                </button>
                <button onClick={handleResend} disabled={resendCooldown > 0 || loading} className="text-indigo-400 transition-colors hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-white/35">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-400 transition-colors hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
