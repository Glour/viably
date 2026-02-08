import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",

  // Performance monitoring: 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Only enable when DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
