import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",

  // Performance monitoring: 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: disabled for normal sessions, 100% for error sessions
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  // Only enable when DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})

// Instrument Next.js router transitions for performance tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
