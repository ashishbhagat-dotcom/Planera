import { useUiStore } from '@/shared/stores/uiStore'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'

const SHORTCUT_SECTIONS = [
  {
    title: 'Navigation',
    items: [
      { keys: ['J'], description: 'Focus next issue' },
      { keys: ['K'], description: 'Focus previous issue' },
      { keys: ['Enter'], description: 'Open focused issue' },
      { keys: ['Esc'], description: 'Close panel / dialog' },
      { keys: ['⌘', 'K'], description: 'Command palette' },
      { keys: ['?'], description: 'Show this shortcut guide' },
    ],
  },
  {
    title: 'Issue List / Board',
    items: [
      { keys: ['C'], description: 'Create new issue' },
      { keys: ['X'], description: 'Toggle issue selection' },
    ],
  },
  {
    title: 'Issue Detail (when panel open)',
    items: [
      { keys: ['S'], description: 'Change status' },
      { keys: ['P'], description: 'Change priority' },
      { keys: ['A'], description: 'Change assignee' },
      { keys: ['L'], description: 'Change labels' },
    ],
  },
]

function KeyChip({ label }: { label: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-[var(--border)] bg-[var(--surface-hover)] px-1 font-mono text-[11px] font-medium text-[var(--text-primary)]">
      {label}
    </kbd>
  )
}

export function ShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useUiStore()
  useKeyboardShortcut('Escape', () => setShortcutsModalOpen(false), { enabled: shortcutsModalOpen })

  if (!shortcutsModalOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setShortcutsModalOpen(false)}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[520px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="rounded p-0.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="space-y-6">
            {SHORTCUT_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div
                      key={item.description}
                      className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-[var(--surface-hover)]"
                    >
                      <span className="text-sm text-[var(--text-primary)]">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((k) => <KeyChip key={k} label={k} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] px-5 py-3">
          <p className="text-xs text-[var(--text-muted)]">Press <KeyChip label="?" /> anywhere to toggle this guide</p>
        </div>
      </div>
    </>
  )
}
