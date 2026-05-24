"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "@/shared/api/query-client"
import { PostHogAnalyticsProvider } from "@/shared/components/providers/posthog-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <PostHogAnalyticsProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* ReactQueryDevtools disabled to reduce dev server memory usage */}
      </QueryClientProvider>
    </PostHogAnalyticsProvider>
  )
}
