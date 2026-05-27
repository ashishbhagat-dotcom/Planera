import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 min
      gcTime: 10 * 60 * 1000,     // 10 min
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  workspaces: {
    all: () => ['workspaces'] as const,
    detail: (slug: string) => ['workspaces', slug] as const,
    members: (slug: string) => ['workspaces', slug, 'members'] as const,
  },
  projects: {
    all: (workspaceSlug: string) => ['projects', workspaceSlug] as const,
    detail: (key: string) => ['projects', 'detail', key] as const,
  },
  issues: {
    all: (projectKey: string, filters?: unknown) =>
      ['issues', projectKey, filters] as const,
    detail: (identifier: string) => ['issues', 'detail', identifier] as const,
    comments: (identifier: string) => ['issues', identifier, 'comments'] as const,
    activity: (identifier: string) => ['issues', identifier, 'activity'] as const,
  },
  notifications: {
    all: () => ['notifications'] as const,
  },
  dashboard: {
    stats: (workspaceSlug: string, projectKey?: string) =>
      ['dashboard', workspaceSlug, projectKey] as const,
  },
  search: {
    results: (q: string) => ['search', q] as const,
  },
}
