import { getPostHogClient } from "./posthog"

/**
 * Typed analytics event helpers for PostHog with dynamic import.
 *
 * T054: Lazy-loads PostHog only when needed in production.
 *
 * Each function is a no-op when PostHog is not initialized (i.e. when
 * NEXT_PUBLIC_POSTHOG_KEY is not configured or in development). This makes
 * it safe to call tracking functions unconditionally throughout the codebase.
 *
 * Event naming follows the project data model conventions.
 */

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function capture(event: string, properties?: Record<string, unknown>): Promise<void> {
  try {
    // T054: Skip in development
    if (process.env.NODE_ENV === "development") return
    if (typeof window === "undefined") return

    // T054: Dynamic import - only loads in production
    const posthog = await getPostHogClient()
    if (!posthog) return

    posthog.capture(event, properties)
  } catch {
    // Silently ignore - analytics should never break the app
  }
}

// ---------------------------------------------------------------------------
// Auth events
// ---------------------------------------------------------------------------

/** Track successful user registration. */
export function trackSignup(method: string): void {
  void capture("signup", { method })
}

// ---------------------------------------------------------------------------
// Project events
// ---------------------------------------------------------------------------

/** Track project creation. */
export function trackProjectCreated(
  projectId: string,
  templateId?: string,
): void {
  void capture("project_created", {
    project_id: projectId,
    template_id: templateId,
  })
}

// ---------------------------------------------------------------------------
// Generation events
// ---------------------------------------------------------------------------

/** Track generation start. */
export function trackGenerationStarted(
  projectId: string,
  templateType?: string,
): void {
  void capture("generation_started", {
    project_id: projectId,
    template_type: templateType,
  })
}

/** Track generation completion. */
export function trackGenerationComplete(
  projectId: string,
  durationMs: number,
  tokensUsed?: number,
): void {
  void capture("generation_complete", {
    project_id: projectId,
    duration_ms: durationMs,
    tokens_used: tokensUsed,
  })
}

// ---------------------------------------------------------------------------
// Deploy events
// ---------------------------------------------------------------------------

/** Track successful deployment. */
export function trackDeployed(
  projectId: string,
  platform?: string,
): void {
  void capture("deployed", {
    project_id: projectId,
    platform,
  })
}

// ---------------------------------------------------------------------------
// Credits / Monetization events
// ---------------------------------------------------------------------------

/** Track credit purchase. */
export function trackPurchasedCredits(
  amount: number,
  packageId?: string,
): void {
  void capture("purchased_credits", {
    amount,
    package_id: packageId,
  })
}
