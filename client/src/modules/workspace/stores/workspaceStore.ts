import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace } from '@/shared/types/models'

interface WorkspaceState {
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace) => void
  clearWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      clearWorkspace: () => set({ currentWorkspace: null }),
    }),
    {
      name: 'planera-workspace',
      partialize: (state) => ({ currentWorkspace: state.currentWorkspace }),
    },
  ),
)
