import posthog, { type PostHog } from "posthog-js"
import { env } from "@/lib/env"

/**
 * PostHog analytics client singleton.
 *
 * Initializes only when NEXT_PUBLIC_POSTHOG_KEY is configured.
 * When the key is absent, all tracking calls become no-ops.
 *
 * Configuration:
 *   - autocapture: false  (privacy-first, explicit tracking only)
 *   - capture_pageview: false  (handled manually or via Next.js router events)
 */

let initialized = false

export function getPostHogClient(): PostHog | null {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null

  if (!initialized && typeof window !== "undefined") {
    posthog.init(key, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      persistence: "localStorage+cookie",
      loaded: (ph) => {
        // Disable in development unless explicitly enabled
        if (env.NEXT_PUBLIC_ENVIRONMENT === "development") {
          ph.opt_out_capturing()
        }
      },
    })
    initialized = true
  }

  return initialized ? posthog : null
}
