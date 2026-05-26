import { create } from 'zustand'

interface FiltersState {
  statusFilter: string[]
  priorityFilter: string[]
  assigneeFilter: string[]
  labelFilter: string[]
  searchQuery: string
  setStatusFilter: (v: string[]) => void
  setPriorityFilter: (v: string[]) => void
  setAssigneeFilter: (v: string[]) => void
  setLabelFilter: (v: string[]) => void
  setSearchQuery: (q: string) => void
  resetAll: () => void
}

export const useFiltersStore = create<FiltersState>((set) => ({
  statusFilter: [],
  priorityFilter: [],
  assigneeFilter: [],
  labelFilter: [],
  searchQuery: '',
  setStatusFilter: (v) => set({ statusFilter: v }),
  setPriorityFilter: (v) => set({ priorityFilter: v }),
  setAssigneeFilter: (v) => set({ assigneeFilter: v }),
  setLabelFilter: (v) => set({ labelFilter: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  resetAll: () =>
    set({ statusFilter: [], priorityFilter: [], assigneeFilter: [], labelFilter: [], searchQuery: '' }),
}))
