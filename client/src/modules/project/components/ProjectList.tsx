import { useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { ProjectCard } from './ProjectCard'
import { CreateProjectModal } from './CreateProjectModal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { RoleGuard } from '@/shared/components/ui/RoleGuard'
import { useCurrentWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { MemberRole } from '@/shared/types/enums'

function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border border-[var(--border)] p-4">
          <div className="flex items-start justify-between">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}

export function ProjectList() {
  const [showCreate, setShowCreate] = useState(false)
  const { data: projects = [], isLoading } = useProjects()
  const workspace = useCurrentWorkspace()

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Projects</h1>
          {workspace && (
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{workspace.name}</p>
          )}
        </div>
        <RoleGuard roles={[MemberRole.OWNER, MemberRole.ADMIN]}>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus size={15} />
            New project
          </button>
        </RoleGuard>
      </div>

      {/* Content */}
      {isLoading ? (
        <ProjectGridSkeleton />
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)]">
            <Layers size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-[var(--text-primary)]">No projects yet</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Create your first project to start tracking issues.</p>
          <RoleGuard roles={[MemberRole.OWNER, MemberRole.ADMIN]}>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus size={15} />
              Create project
            </button>
          </RoleGuard>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
