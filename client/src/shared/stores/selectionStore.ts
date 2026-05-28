import { create } from 'zustand'

interface SelectionStore {
  selectedIds: Set<string>
  toggle: (id: string) => void
  selectRange: (ids: string[]) => void
  selectAll: (ids: string[]) => void
  clear: () => void
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedIds: new Set(),

  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    }),

  selectRange: (ids) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      ids.forEach((id) => next.add(id))
      return { selectedIds: next }
    }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  clear: () => set({ selectedIds: new Set() }),
}))
