import { useFiltersStore } from '@/shared/stores/filtersStore'
import type { IssueFilters } from '@/modules/issue/services/issueApi'

export function useBoardFilters() {
  const {
    priorityFilter,
    assigneeFilter,
    labelFilter,
    searchQuery,
    setPriorityFilter,
    setAssigneeFilter,
    setLabelFilter,
    setSearchQuery,
    resetAll,
  } = useFiltersStore()

  const activeFilterCount =
    priorityFilter.length + assigneeFilter.length + labelFilter.length + (searchQuery ? 1 : 0)

  const apiFilters: IssueFilters = {
    ...(priorityFilter.length > 0 && { priority: priorityFilter.join(',') }),
    ...(assigneeFilter.length > 0 && { assignee_id: assigneeFilter.join(',') }),
    ...(labelFilter.length > 0 && { label: labelFilter.join(',') }),
    ...(searchQuery && { search: searchQuery }),
  }

  return {
    priorityFilter,
    assigneeFilter,
    labelFilter,
    searchQuery,
    setPriorityFilter,
    setAssigneeFilter,
    setLabelFilter,
    setSearchQuery,
    resetAll,
    activeFilterCount,
    apiFilters,
  }
}
