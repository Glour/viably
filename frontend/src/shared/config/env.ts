import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  /**
   * Server-side environment variables (not available on the client).
   * Accessing these in client code will throw an error.
   */
  server: {
    SENTRY_AUTH_TOKEN: z.string().optional(),
  },

  /**
   * Client-side environment variables (exposed to the browser).
   * Must be prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8000"),
    NEXT_PUBLIC_WS_URL: z.string().url().default("ws://localhost:8000"),
    NEXT_PUBLIC_ENVIRONMENT: z
      .enum(["development", "staging", "production"])
      .default("development"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().url().default("https://viably.dev"),
  },

  /**
   * For Next.js >= 13.4.4, only client-side variables need to be
   * manually destructured. Server-side variables are inferred automatically.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  /**
   * Treat empty strings as undefined so that optional variables
   * with empty values pass validation correctly.
   */
  emptyStringAsUndefined: true,
})
