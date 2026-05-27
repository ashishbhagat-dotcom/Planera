import { useState, useRef, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, Check, Mail, ArrowLeft } from 'lucide-react'
import { sendOtp, verifyOtp } from '../services/authApi'
import { useAuthStore } from '../stores/authStore'
import { ApiError } from '@/shared/types/api'
import { cn } from '@/shared/lib/utils'

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: '', color: '' }
  const checks = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)]
  const score = checks.filter(Boolean).length
  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' }
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
}

const OTP_LENGTH = 6

export function RegisterForm() {
  const [step, setStep] = useState<'details' | 'otp'>('details')

  // Step 1 state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2 state
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const strength = passwordStrength(password)

  function startCooldown() {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return v - 1
      })
    }, 1000)
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendOtp({ email, full_name: fullName, password })
      setStep('otp')
      startCooldown()
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Something went wrong. Please try again.')
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
      startCooldown()
      setDigits(Array(OTP_LENGTH).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    const otp_code = digits.join('')
    if (otp_code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { user, access } = await verifyOtp({ email, otp_code })
      setAuth(user, access)
      navigate('/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleDigitKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleDigitPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((c, i) => { next[i] = c })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
  }

  const logo = (
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
  )

  const fieldClass = cn(
    'w-full rounded-lg border border-[var(--border)] bg-[var(--background)]',
    'px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]',
    'outline-none transition-colors',
    'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20',
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[var(--accent)]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {logo}

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-black/5 dark:shadow-black/30">

          {/* ── Step 1: Account details ── */}
          {step === 'details' && (
            <>
              <h1 className="mb-1 text-xl font-semibold text-[var(--text-primary)]">Create your account</h1>
              <p className="mb-6 text-sm text-[var(--text-muted)]">We'll send a verification code to your email</p>

              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-400">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Full name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={fieldClass}
                    placeholder="Jane Smith"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(fieldClass, 'pr-10')}
                      placeholder="Min. 8 characters"
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

                  {password.length > 0 && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= strength.score ? strength.color : 'bg-[var(--border)]')} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">
                          {strength.label && (
                            <span className={cn('font-medium', strength.score === 1 && 'text-red-500', strength.score === 2 && 'text-yellow-500', strength.score === 3 && 'text-blue-500', strength.score === 4 && 'text-emerald-500')}>
                              {strength.label}
                            </span>
                          )}
                        </span>
                        {strength.score === 4 && (
                          <span className="flex items-center gap-1 text-xs text-emerald-500">
                            <Check size={11} strokeWidth={3} /> Strong password
                          </span>
                        )}
                      </div>
                    </div>
                  )}
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
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                  {loading ? 'Sending code…' : 'Send verification code'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-[var(--text-muted)]">
                By creating an account you agree to our{' '}
                <span className="cursor-default underline underline-offset-2">Terms</span> and{' '}
                <span className="cursor-default underline underline-offset-2">Privacy Policy</span>.
              </p>
            </>
          )}

          {/* ── Step 2: OTP verification ── */}
          {step === 'otp' && (
            <>
              <button
                type="button"
                onClick={() => { setStep('details'); setError(''); setDigits(Array(OTP_LENGTH).fill('')) }}
                className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="mb-6">
                <h1 className="mb-1 text-xl font-semibold text-[var(--text-primary)]">Check your email</h1>
                <p className="text-sm text-[var(--text-muted)]">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-[var(--text-primary)]">{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-400">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-[var(--text-secondary)]">Verification code</label>
                  <div className="flex gap-2">
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        onPaste={handleDigitPaste}
                        className={cn(
                          'h-12 w-full rounded-lg border text-center text-lg font-semibold',
                          'bg-[var(--background)] text-[var(--text-primary)]',
                          'outline-none transition-colors',
                          d
                            ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20'
                            : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20',
                        )}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || digits.join('').length < OTP_LENGTH}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg',
                    'bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white',
                    'transition-colors hover:bg-[var(--accent-hover)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                  )}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Verifying…' : 'Verify & create account'}
                </button>
              </form>

              <div className="mt-5 text-center text-sm text-[var(--text-muted)]">
                Didn't receive it?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className={cn(
                    'font-medium transition-colors',
                    resendCooldown > 0 || loading
                      ? 'cursor-not-allowed text-[var(--text-muted)]'
                      : 'text-[var(--accent)] hover:text-[var(--accent-hover)]',
                  )}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
