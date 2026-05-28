import { create } from 'zustand'

type BoardViewMode = 'kanban' | 'list'

function initDarkMode(): boolean {
  const stored = localStorage.getItem('planera.darkMode')
  const dark = stored !== null
    ? stored === 'true'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', dark)
  return dark
}

interface UiState {
  sidebarOpen: boolean
  activeIssueId: string | null
  commandPaletteOpen: boolean
  boardViewMode: BoardViewMode
  notificationPanelOpen: boolean
  shortcutsModalOpen: boolean
  darkMode: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setActiveIssueId: (id: string | null) => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setBoardViewMode: (mode: BoardViewMode) => void
  toggleNotificationPanel: () => void
  setShortcutsModalOpen: (open: boolean) => void
  toggleShortcutsModal: () => void
  toggleDarkMode: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeIssueId: null,
  commandPaletteOpen: false,
  boardViewMode: 'kanban',
  notificationPanelOpen: false,
  shortcutsModalOpen: false,
  darkMode: initDarkMode(),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveIssueId: (id) => set({ activeIssueId: id }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setBoardViewMode: (mode) => set({ boardViewMode: mode }),
  toggleNotificationPanel: () => set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  toggleShortcutsModal: () => set((s) => ({ shortcutsModalOpen: !s.shortcutsModalOpen })),
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('planera.darkMode', String(next))
    return { darkMode: next }
  }),
}))
