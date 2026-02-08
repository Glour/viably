"use client"

import { useEffect, useState, type ReactNode } from "react"
import { env } from "@/lib/env"
import type { PostHog } from "posthog-js"

/**
 * PostHog analytics provider with dynamic import.
 *
 * T054: Lazy-loads posthog-js (32MB) only in production.
 * In development, this provider renders children directly with zero overhead.
 *
 * Wraps the application with PostHogProvider from posthog-js/react when a
 * PostHog API key is configured. When no key is present, children are
 * rendered directly with zero overhead.
 *
 * Configuration is read from env.NEXT_PUBLIC_POSTHOG_KEY and
 * env.NEXT_PUBLIC_POSTHOG_HOST (see lib/env.ts).
 */
export function PostHogAnalyticsProvider({
  children,
}: {
  children: ReactNode
}) {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY
  const [posthogClient, setPosthogClient] = useState<PostHog | null>(null)
  const [PostHogProvider, setPostHogProvider] = useState<any>(null)

  useEffect(() => {
    // T054: Skip PostHog entirely in development
    if (process.env.NODE_ENV === "development" || !key) {
      return
    }

    // T054: Dynamic import - only loads in production
    Promise.all([
      import("posthog-js"),
      import("posthog-js/react")
    ]).then(([posthogModule, reactModule]) => {
      const posthog = posthogModule.default

      posthog.init(key, {
        api_host: env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        autocapture: false,
        capture_pageview: false,
        persistence: "localStorage+cookie",
      })

      setPosthogClient(posthog)
      setPostHogProvider(() => reactModule.PostHogProvider)
    }).catch((error) => {
      console.error("Failed to load PostHog:", error)
    })
  }, [key])

  // T054: In development or when no key, render children directly
  if (process.env.NODE_ENV === "development" || !key) {
    return <>{children}</>
  }

  // Wait for PostHog to load in production
  if (!posthogClient || !PostHogProvider) {
    return <>{children}</>
  }

  return <PostHogProvider client={posthogClient}>{children}</PostHogProvider>
}
