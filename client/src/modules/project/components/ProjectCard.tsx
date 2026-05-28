import { useNavigate } from 'react-router-dom'
import { Layers, ArrowRight } from 'lucide-react'
import type { Project } from '@/shared/types/models'
import { FavoriteButton } from '@/modules/favorites'

interface Props {
  project: Project
}

const DEFAULT_COLOR = '#6366f1'

export function ProjectCard({ project }: Props) {
  const navigate = useNavigate()
  const color = project.color || DEFAULT_COLOR

  return (
    <div
      onClick={() => navigate(`/app/projects/${project.key}/board`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/projects/${project.key}/board`)}
      className="group flex cursor-pointer flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all hover:border-[var(--accent)] hover:shadow-sm"
    >
      {/* Icon + key badge + star */}
      <div className="flex items-start justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-lg text-xl"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {project.icon || <Layers size={20} />}
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton targetType="project" targetId={project.id} />
          <span className="rounded bg-[var(--surface-hover)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-muted)]">
            {project.key}
          </span>
        </div>
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
          {project.name}
        </h3>
        {project.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-[var(--text-muted)]">
            {project.description}
          </p>
        )}
      </div>

      {/* Footer: issue count + arrow */}
      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span>{project.issue_count} {project.issue_count === 1 ? 'issue' : 'issues'}</span>
        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]" />
      </div>
    </div>
  )
}
