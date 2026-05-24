import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"
import withBundleAnalyzer from "@next/bundle-analyzer"
import createMDX from "@next/mdx"
import createNextIntlPlugin from 'next-intl/plugin'

const isDev = process.env.NODE_ENV === 'development'

// In Docker dev, Next.js server runs inside a container — use service name, not localhost
// INTERNAL_API_URL is for server-side rewrites; NEXT_PUBLIC_API_URL is for browser
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const nextConfig: NextConfig = {
  // Configure pageExtensions to include MDX files
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  // @webcontainer/api is ESM-only, Next.js needs to transpile it
  transpilePackages: ['@webcontainer/api', '@codesandbox/sandpack-react'],

  // No COOP/COEP headers — Sandpack works without them.
  // WebContainers (which need SharedArrayBuffer) are disabled in favour of
  // Sandpack which works in all browsers without special headers.

  // In dev: proxy /api/* to backend so OAuth redirects work on localhost:3000
  async rewrites() {
    if (!isDev) return []
    return [
      {
        source: "/api/:path*",
        destination: `${INTERNAL_API_URL}/api/:path*`,
      },
    ]
  },

  // Experimental features
  experimental: {
    // Production optimizations only - keeps dev server fast
    webpackMemoryOptimizations: true,
    optimizePackageImports: ['lucide-react', '@tanstack/react-query', 'motion'],
  },

  // Production optimizations (compiler options)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Minimal webpack config - Turbopack handles dev optimizations
  webpack: (config, { dev }) => {
    if (dev) {
      // Fast source maps for debugging
      config.devtool = 'eval-cheap-module-source-map'
    }
    return config
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

// Configure next-intl
const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

// Apply configurations in order: MDX -> next-intl -> Bundle Analyzer -> Sentry (production only)
const configWithMDX = withMDX(nextConfig)
const configWithIntl = withNextIntl(configWithMDX)
const configWithAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(configWithIntl)

// T054: Only wrap with Sentry in production to save 52MB in dev mode
const finalConfig = isDev
  ? configWithAnalyzer
  : withSentryConfig(configWithAnalyzer, {
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

export default finalConfig
