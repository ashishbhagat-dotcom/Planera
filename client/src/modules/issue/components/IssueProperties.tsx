import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, User, Hash, Timer, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { IssueStatus, IssuePriority, MemberRole } from '@/shared/types/enums'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/shared/lib/constants'
import { useUpdateIssue } from '../hooks/useIssueMutations'
import { useLabels } from '../hooks/useIssues'
import { useMembers } from '@/modules/workspace/hooks/useMembers'
import { Avatar } from '@/shared/components/ui/Avatar'
import { StatusBadge, STATUS_ICON } from './StatusBadge'
import { PriorityBadge, PRIORITY_ICON } from './PriorityIcon'
import { useCycles } from '@/modules/cycle/hooks/useCycles'
import { useSetIssueCycle } from '@/modules/cycle/hooks/useCycleMutations'
import { useMyRole } from '@/modules/workspace/hooks/useMyRole'
import type { Issue } from '@/shared/types/models'

// ── Popover via portal (escapes the panel's transform stacking context) ──────

function Popover({
  anchor,
  onClose,
  children,
}: {
  anchor: DOMRect
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose])

  // Flip up if too close to the bottom of the viewport
  const spaceBelow = window.innerHeight - anchor.bottom
  const top = spaceBelow > 220 ? anchor.bottom + 4 : anchor.top - 4

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top,
        left: anchor.left,
        transform: spaceBelow <= 220 ? 'translateY(-100%)' : undefined,
        zIndex: 9999,
        minWidth: Math.max(anchor.width, 160),
      }}
      className="rounded-lg border border-[var(--border)] bg-[var(--background)] py-1 shadow-xl"
    >
      {children}
    </div>,
    document.body,
  )
}

// ── Generic editable property row ────────────────────────────────────────────

function EditableProperty({
  label,
  display,
  children,
  dataProperty,
}: {
  label: string
  display: React.ReactNode
  children: (close: () => void) => React.ReactNode
  dataProperty?: string
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  function toggle() {
    if (anchor) { setAnchor(null); return }
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setAnchor(rect)
  }

  const close = useCallback(() => setAnchor(null), [])

  return (
    <div className="py-2.5">
      <p className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
      <button
        ref={btnRef}
        onClick={toggle}
        data-property={dataProperty}
        className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
      >
        {display}
      </button>
      {anchor && <Popover anchor={anchor} onClose={close}>{children(close)}</Popover>}
    </div>
  )
}

function DropdownItem({
  selected,
  onClick,
  children,
}: {
  selected?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-[var(--surface-hover)]',
        selected && 'bg-[var(--surface-hover)]',
      )}
    >
      <span className="flex w-3 shrink-0 items-center justify-center">
        {selected && <Check size={11} className="text-[var(--accent)]" />}
      </span>
      {children}
    </button>
  )
}

// ── IssueProperties ───────────────────────────────────────────────────────────

interface Props {
  issue: Issue
  projectKey: string
}

export function IssueProperties({ issue, projectKey }: Props) {
  const update = useUpdateIssue(projectKey, issue.identifier)
  const { data: members = [] } = useMembers()
  const { data: labels = [] } = useLabels()
  const { data: cycles = [] } = useCycles(projectKey)
  const setCycle = useSetIssueCycle(projectKey)
  const myRole = useMyRole()
  const canManageSprint = myRole !== MemberRole.MEMBER

  function set(data: Parameters<typeof update.mutate>[0]) {
    update.mutate(data)
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {/* Status */}
      <EditableProperty label="Status" display={<StatusBadge status={issue.status as IssueStatus} />} dataProperty="status">
        {(close) => (
          <>
            {Object.values(IssueStatus).map((s) => (
              <DropdownItem
                key={s}
                selected={s === issue.status}
                onClick={() => { set({ status: s }); close() }}
              >
                {STATUS_ICON[s]}
                <span>{STATUS_LABELS[s]}</span>
              </DropdownItem>
            ))}
          </>
        )}
      </EditableProperty>

      {/* Priority */}
      <EditableProperty label="Priority" display={<PriorityBadge priority={issue.priority as IssuePriority} />} dataProperty="priority">
        {(close) => (
          <>
            {Object.values(IssuePriority).map((p) => (
              <DropdownItem
                key={p}
                selected={p === issue.priority}
                onClick={() => { set({ priority: p }); close() }}
              >
                {PRIORITY_ICON[p]}
                <span>{PRIORITY_LABELS[p]}</span>
              </DropdownItem>
            ))}
          </>
        )}
      </EditableProperty>

      {/* Assignee */}
      <EditableProperty
        label="Assignee"
        dataProperty="assignee"
        display={
          issue.assignee ? (
            <span className="flex items-center gap-1.5">
              <Avatar
                src={issue.assignee.avatar_url}
                name={issue.assignee.full_name || issue.assignee.email}
                size="sm"
              />
              <span className="truncate text-xs">
                {issue.assignee.full_name || issue.assignee.email}
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <User size={14} />
              Unassigned
            </span>
          )
        }
      >
        {(close) => (
          <>
            <DropdownItem
              selected={!issue.assignee}
              onClick={() => { set({ assignee_id: null }); close() }}
            >
              <User size={14} className="text-[var(--text-muted)]" />
              <span>Unassigned</span>
            </DropdownItem>
            {members.map((m) => (
              <DropdownItem
                key={m.user.id}
                selected={issue.assignee?.id === m.user.id}
                onClick={() => { set({ assignee_id: m.user.id }); close() }}
              >
                <Avatar
                  src={m.user.avatar_url}
                  name={m.user.full_name || m.user.email}
                  size="sm"
                />
                <span className="truncate">
                  {m.user.full_name || m.user.email}
                </span>
              </DropdownItem>
            ))}
          </>
        )}
      </EditableProperty>

      {/* Labels */}
      <EditableProperty
        label="Labels"
        dataProperty="labels"
        display={
          issue.labels?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {issue.labels.map((l) => (
                <span
                  key={l.id}
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: l.color }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[var(--text-muted)]">None</span>
          )
        }
      >
        {(close) => {
          const currentIds = new Set(issue.labels?.map((l) => l.id))

          function toggleLabel(labelId: string) {
            const next = currentIds.has(labelId)
              ? [...currentIds].filter((id) => id !== labelId)
              : [...currentIds, labelId]
            set({ label_ids: next })
          }

          return labels.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--text-muted)]">No labels</div>
          ) : (
            <>
              {labels.map((l) => (
                <DropdownItem
                  key={l.id}
                  selected={currentIds.has(l.id)}
                  onClick={() => toggleLabel(l.id)}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="truncate">{l.name}</span>
                </DropdownItem>
              ))}
              {currentIds.size > 0 && (
                <div className="border-t border-[var(--border)] pt-1 mt-1">
                  <DropdownItem onClick={() => { set({ label_ids: [] }); close() }}>
                    <X size={12} className="text-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)]">Clear labels</span>
                  </DropdownItem>
                </div>
              )}
            </>
          )
        }}
      </EditableProperty>

      {/* Due date */}
      <div className="py-2.5">
        <p className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">Due date</p>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={issue.due_date ? issue.due_date.split('T')[0] : ''}
            onChange={(e) => set({ due_date: e.target.value || null })}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:invert"
          />
          {issue.due_date && (
            <button
              onClick={() => set({ due_date: null })}
              className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Estimate */}
      <div className="py-2.5">
        <p className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">Estimate</p>
        <div className="flex items-center gap-1.5">
          <Hash size={13} className="shrink-0 text-[var(--text-muted)]" />
          <input
            type="number"
            min={0}
            placeholder="—"
            value={issue.estimate ?? ''}
            onChange={(e) =>
              set({ estimate: e.target.value !== '' ? Number(e.target.value) : null })
            }
            onBlur={(e) =>
              set({ estimate: e.target.value !== '' ? Number(e.target.value) : null })
            }
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
          />
        </div>
      </div>

      {/* Cycle — editable only for admins/owners */}
      {canManageSprint ? (
        <EditableProperty
          label="Sprint"
          display={
            issue.cycle_id ? (
              <span className="flex items-center gap-1.5 text-xs">
                <Timer size={12} className="text-green-500" />
                <span className="truncate">
                  {cycles.find((c) => c.id === issue.cycle_id)?.name ?? 'Sprint'}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Timer size={12} />
                No sprint
              </span>
            )
          }
        >
          {(close) => (
            <>
              <DropdownItem
                selected={!issue.cycle_id}
                onClick={() => { setCycle.mutate({ identifier: issue.identifier, cycleId: null }); close() }}
              >
                <Timer size={12} className="text-[var(--text-muted)]" />
                <span>No sprint</span>
              </DropdownItem>
              {cycles.map((c) => (
                <DropdownItem
                  key={c.id}
                  selected={issue.cycle_id === c.id}
                  onClick={() => { setCycle.mutate({ identifier: issue.identifier, cycleId: c.id }); close() }}
                >
                  <Timer size={12} className={c.status === 'active' ? 'text-green-500' : 'text-[var(--text-muted)]'} />
                  <span className="truncate">{c.name}</span>
                </DropdownItem>
              ))}
            </>
          )}
        </EditableProperty>
      ) : (
        <div className="py-2.5">
          <p className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">Sprint</p>
          <div className="flex items-center gap-1.5 px-1 py-1 text-sm text-[var(--text-primary)]">
            {issue.cycle_id ? (
              <>
                <Timer size={12} className="text-green-500" />
                <span className="truncate">
                  {cycles.find((c) => c.id === issue.cycle_id)?.name ?? 'Sprint'}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Timer size={12} />
                No sprint
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
