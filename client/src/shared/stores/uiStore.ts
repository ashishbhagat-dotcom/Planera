import { create } from 'zustand'

type BoardViewMode = 'kanban' | 'list'

interface UiState {
  sidebarOpen: boolean
  activeIssueId: string | null
  commandPaletteOpen: boolean
  boardViewMode: BoardViewMode
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setActiveIssueId: (id: string | null) => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setBoardViewMode: (mode: BoardViewMode) => void
  notificationPanelOpen: boolean
  toggleNotificationPanel: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeIssueId: null,
  commandPaletteOpen: false,
  boardViewMode: 'kanban',
  notificationPanelOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveIssueId: (id) => set({ activeIssueId: id }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setBoardViewMode: (mode) => set({ boardViewMode: mode }),
  toggleNotificationPanel: () => set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
}))
