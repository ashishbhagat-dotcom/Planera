import { Link, useLocation, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  to?: string
}

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation()
  const { key } = useParams<{ key?: string }>()
  const segments = pathname.replace(/^\/app\/?/, '').split('/').filter(Boolean)

  if (segments.length === 0) return []

  const crumbs: Crumb[] = []

  if (segments[0] === 'dashboard') {
    crumbs.push({ label: 'Dashboard' })
  } else if (segments[0] === 'projects') {
    crumbs.push({ label: 'Projects', to: '/app/projects' })
    if (key) {
      crumbs.push({ label: key.toUpperCase(), to: `/app/projects/${key}/board` })
      if (segments[2] === 'board') crumbs.push({ label: 'Board' })
      else if (segments[2] === 'issues') crumbs.push({ label: 'Issues' })
    }
  } else if (segments[0] === 'notifications') {
    crumbs.push({ label: 'Notifications' })
  } else if (segments[0] === 'settings') {
    crumbs.push({ label: 'Settings' })
  }

  return crumbs
}

export function BreadcrumbNav() {
  const crumbs = useBreadcrumbs()

  return (
    <nav className="flex items-center gap-1 px-4 text-sm text-[var(--text-muted)]">
      <span className="font-medium text-[var(--text-primary)]">Planera</span>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={14} className="shrink-0" />
          {crumb.to && i < crumbs.length - 1 ? (
            <Link to={crumb.to} className="hover:text-[var(--text-primary)] transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-[var(--text-primary)]">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
