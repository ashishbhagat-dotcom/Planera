import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Kanban, Users, Sparkles, GitBranch, Bell, ChevronRight } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'

const NAV_LINKS = ['Features', 'Pricing', 'Changelog', 'Docs']

const FEATURES = [
  {
    icon: <Kanban size={20} />,
    title: 'Board & List views',
    description: 'Visualize work the way your team thinks — drag-and-drop boards or compact list views with instant filtering.',
  },
  {
    icon: <Sparkles size={20} />,
    title: 'AI-powered assistant',
    description: 'Generate descriptions, break issues into sub-tasks, and get effort estimates with a single click.',
  },
  {
    icon: <GitBranch size={20} />,
    title: 'Cycles & Sprints',
    description: 'Plan and track sprints with auto-advancing cycles. Issues roll forward automatically when a sprint ends.',
  },
  {
    icon: <Zap size={20} />,
    title: 'Blazing fast',
    description: 'Optimistic updates and real-time sync mean you never wait. Changes appear instantly across every tab.',
  },
  {
    icon: <Bell size={20} />,
    title: 'Real-time notifications',
    description: "Stay in sync with your team. Get notified the moment you're assigned, mentioned, or a status changes.",
  },
  {
    icon: <Users size={20} />,
    title: 'Role-based permissions',
    description: 'Owner, Admin, Member — granular control over who can create projects, manage sprints, and more.',
  },
]

const STEPS = [
  { step: '01', title: 'Create a workspace', desc: 'Sign up and invite your team in under 60 seconds.' },
  { step: '02', title: 'Set up a project', desc: 'Define your project, add labels, and configure sprints.' },
  { step: '03', title: 'Ship faster', desc: 'Track progress, resolve blockers, and hit your deadlines.' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h7v7H3z" />
          <path d="M14 3h7v7h-7z" />
          <path d="M3 14h7v7H3z" />
          <circle cx="17.5" cy="17.5" r="3.5" />
        </svg>
      </div>
      <span className="text-base font-semibold tracking-tight text-white">Planera</span>
    </div>
  )
}

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-indigo-800/8 blur-[100px]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l} href="#" className="text-sm text-white/50 transition-colors hover:text-white/90">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/app')}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-400"
              >
                Go to app <ArrowRight size={13} />
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-white/60 transition-colors hover:text-white">Sign in</Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-400 hover:shadow-indigo-400/30"
                >
                  Get started <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-28 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
          <Sparkles size={11} />
          AI-powered project management
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
          Plan better.{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
            Ship faster.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/50">
          Planera brings clarity and velocity to your team's workflow — with real-time boards, AI assistance, and sprint management built right in.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:bg-indigo-400"
            >
              Go to your workspace <ArrowRight size={15} />
            </button>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:bg-indigo-400 hover:shadow-indigo-400/30"
              >
                Start for free <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
              >
                Sign in to your team
              </Link>
            </>
          )}
        </div>

        <p className="mt-4 text-xs text-white/30">Free forever · No credit card required</p>

        {/* Mock UI preview */}
        <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-white/8 bg-[#0d0d1a] shadow-2xl shadow-black/60">
          <div className="flex h-8 items-center gap-1.5 border-b border-white/5 px-4">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-white/20">app.planera.io</span>
          </div>
          <div className="grid grid-cols-4 gap-px bg-white/5 p-px">
            {/* Sidebar mock */}
            <div className="col-span-1 bg-[#0d0d1a] p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-indigo-500/80" />
                <div className="h-2.5 w-16 rounded-full bg-white/20" />
              </div>
              {['My Issues', 'Dashboard', 'Projects', 'Settings'].map((item) => (
                <div key={item} className="mb-1 flex items-center gap-2 rounded px-2 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <div className="h-2 rounded-full bg-white/15" style={{ width: `${item.length * 6}px` }} />
                </div>
              ))}
            </div>
            {/* Board mock */}
            <div className="col-span-3 bg-[#0a0a15] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-3 w-24 rounded-full bg-white/20" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-md bg-indigo-500/30" />
                  <div className="h-6 w-16 rounded-md bg-white/10" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Backlog', 'In Progress', 'Done'].map((col, ci) => (
                  <div key={col} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${ci === 0 ? 'bg-gray-500' : ci === 1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <div className="h-2 w-14 rounded-full bg-white/20" />
                    </div>
                    {Array.from({ length: ci === 1 ? 3 : 2 }).map((_, i) => (
                      <div key={i} className="rounded-lg border border-white/5 bg-[#12121f] p-3 space-y-2">
                        <div className="h-2 rounded-full bg-white/20" style={{ width: `${60 + i * 15}%` }} />
                        <div className="h-1.5 rounded-full bg-white/10" style={{ width: `${40 + i * 10}%` }} />
                        <div className="flex items-center justify-between pt-1">
                          <div className="h-4 w-8 rounded-full bg-indigo-500/30" />
                          <div className="h-4 w-4 rounded-full bg-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mb-4 text-center text-sm font-medium text-indigo-400">Everything you need</div>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
          Built for teams that move fast
        </h2>
        <p className="mx-auto mb-14 max-w-lg text-center text-white/50">
          Every feature is designed to eliminate friction and keep your team focused on what matters.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-white/6 bg-white/[0.03] p-6 transition-all duration-300 hover:border-indigo-500/20 hover:bg-indigo-500/[0.04]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                {f.icon}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-white/45">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-10 md:p-16">
          <div className="mb-4 text-center text-sm font-medium text-indigo-400">How it works</div>
          <h2 className="mb-14 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
            Up and running in minutes
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-5 hidden h-px w-full translate-x-5 bg-gradient-to-r from-indigo-500/30 to-transparent md:block" />
                )}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-sm font-bold text-indigo-400">
                  {s.step}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/45">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent px-8 py-16">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
          </div>
          <h2 className="relative mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ready to ship faster?
          </h2>
          <p className="relative mx-auto mb-8 max-w-md text-white/50">
            Join teams already using Planera to stay organized, move faster, and deliver great work.
          </p>
          <Link
            to="/register"
            className="relative inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all hover:bg-indigo-400"
          >
            Get started for free <ChevronRight size={15} />
          </Link>
          <p className="relative mt-4 text-xs text-white/30">No credit card required · Free forever</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-xs text-white/25">© {new Date().getFullYear()} Planera. Built for teams that ship.</p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <a key={l} href="#" className="text-xs text-white/30 transition-colors hover:text-white/60">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
