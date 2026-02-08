import { QueryClient } from "@tanstack/react-query"

/**
 * Cache Configuration Policy
 *
 * @staleTime (5 minutes)
 * - How long data is considered "fresh" before it needs refetching
 * - During this period, React Query returns cached data without background refetch
 * - Reduces unnecessary network requests for frequently accessed data
 *
 * @gcTime (10 minutes) - formerly cacheTime
 * - How long inactive/unused query data stays in memory before garbage collection
 * - Queries that aren't being actively observed are marked "inactive"
 * - After gcTime expires, the data is removed from cache
 * - This prevents memory leaks during long user sessions
 *
 * Memory Optimization Benefits:
 * - Users navigating between pages won't trigger unnecessary refetches (within 5min)
 * - Unused data (e.g., old project details) is cleaned up after 10min
 * - Browser memory usage stabilizes during long sessions
 *
 * Performance Trade-offs:
 * - Pro: Reduced API load, faster perceived performance
 * - Con: Data can be up to 5min stale (acceptable for most UI data)
 * - Critical real-time data (e.g., generation status) should override with staleTime: 0
 *
 * @see https://tanstack.com/query/latest/docs/react/guides/caching
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
