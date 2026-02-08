import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
  /* config options here */
}

const configWithAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig)

export default withSentryConfig(configWithAnalyzer, {
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Disable source map uploads when org/project are not configured
  sourcemaps: {
    disable: !process.env.SENTRY_ORG,
  },

  // Optional: org and project for source map uploads in CI
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Tunnel Sentry events through Next.js to avoid ad-blockers
  tunnelRoute: "/monitoring",
})
