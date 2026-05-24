export const queryKeys = {
  user: {
    me: ["user", "me"] as const,
  },
  templates: {
    all: (filters?: { category?: string; search?: string }) =>
      ["templates", filters ?? {}] as const,
    detail: (slugOrId: string) => ["templates", "detail", slugOrId] as const,
  },
  projects: {
    all: (filters?: { status?: string; page?: number; perPage?: number }) =>
      ["projects", filters ?? {}] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
    recent: ["projects", "recent"] as const,
  },
  credits: {
    balance: ["credits", "balance"] as const,
    transactions: (filters?: {
      type?: string
      offset?: number
      limit?: number
    }) => ["credits", "transactions", filters ?? {}] as const,
    dailyBonus: ["credits", "daily-bonus"] as const,
  },
  generation: {
    code: (projectId: string) => ["generation", "code", projectId] as const,
  },
  conversations: {
    all: () => ["conversations"] as const,
    list: (projectId: string, filters?: { limit?: number; offset?: number }) =>
      ["conversations", "list", projectId, filters ?? {}] as const,
    detail: (id: string) => ["conversations", "detail", id] as const,
  },
} as const
