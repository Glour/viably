"use client"

import { useEffect, type ReactNode } from "react"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { env } from "@/lib/env"

/**
 * PostHog analytics provider.
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

  useEffect(() => {
    if (!key) return

    posthog.init(key, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      persistence: "localStorage+cookie",
      loaded: (ph) => {
        if (env.NEXT_PUBLIC_ENVIRONMENT === "development") {
          ph.opt_out_capturing()
        }
      },
    })
  }, [key])

  if (!key) {
    return <>{children}</>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
