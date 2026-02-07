/**
 * Query Keys Convention — contract for React Query cache keys
 *
 * Rules:
 * 1. Keys are hierarchical arrays for granular invalidation
 * 2. Entity-level keys (e.g., ['projects']) invalidate ALL queries for that entity
 * 3. Specific keys (e.g., ['projects', id]) target a single resource
 * 4. Filter-dependent keys include serialized filters for cache separation
 */

export const queryKeys = {
  user: {
    me: ['user', 'me'] as const,
    credits: ['user', 'credits'] as const,
  },
  templates: {
    all: (filters?: { category?: string; search?: string }) =>
      ['templates', filters ?? {}] as const,
    detail: (slugOrId: string) => ['templates', 'detail', slugOrId] as const,
  },
  projects: {
    all: (filters?: { status?: string; page?: number; perPage?: number }) =>
      ['projects', filters ?? {}] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    recent: ['projects', 'recent'] as const,
  },
  credits: {
    balance: ['credits', 'balance'] as const,
    transactions: (filters?: { type?: string; offset?: number; limit?: number }) =>
      ['credits', 'transactions', filters ?? {}] as const,
    dailyBonus: ['credits', 'daily-bonus'] as const,
  },
} as const
