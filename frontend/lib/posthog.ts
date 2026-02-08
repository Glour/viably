import type { PostHog } from "posthog-js"
import { env } from "@/lib/env"

/**
 * PostHog analytics client singleton with dynamic import.
 *
 * T054: Lazy-loads posthog-js (32MB) only in production and when needed.
 * This prevents the library from being included in development builds.
 *
 * Initializes only when NEXT_PUBLIC_POSTHOG_KEY is configured.
 * When the key is absent, all tracking calls become no-ops.
 *
 * Configuration:
 *   - autocapture: false  (privacy-first, explicit tracking only)
 *   - capture_pageview: false  (handled manually or via Next.js router events)
 */

let initialized = false
let posthogInstance: PostHog | null = null

export async function getPostHogClient(): Promise<PostHog | null> {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null

  // T054: Skip PostHog entirely in development
  if (process.env.NODE_ENV === "development") {
    return null
  }

  if (!initialized && typeof window !== "undefined") {
    try {
      // T054: Dynamic import - only loads in production
      const { default: posthog } = await import("posthog-js")

      posthog.init(key, {
        api_host: env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        autocapture: false,
        capture_pageview: false,
        persistence: "localStorage+cookie",
      })

      posthogInstance = posthog
      initialized = true
    } catch (error) {
      console.error("Failed to load PostHog:", error)
      return null
    }
  }

  return posthogInstance
}
