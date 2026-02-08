"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { getQueryClient } from "@/lib/api/query-client"
import { PostHogAnalyticsProvider } from "@/components/providers/posthog-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <PostHogAnalyticsProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </PostHogAnalyticsProvider>
  )
}
