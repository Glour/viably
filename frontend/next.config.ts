import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"
import withBundleAnalyzer from "@next/bundle-analyzer"
import createMDX from "@next/mdx"

const nextConfig: NextConfig = {
  // Configure pageExtensions to include MDX files
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],

  // Experimental features if needed
  experimental: {
    mdxRs: false, // Use the stable MDX loader
  },
}

// Configure MDX with plugins and options
const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

// Apply configurations in order: MDX -> Bundle Analyzer -> Sentry
const configWithMDX = withMDX(nextConfig)
const configWithAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(configWithMDX)

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
