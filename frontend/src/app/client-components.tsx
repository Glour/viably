"use client"

import dynamic from "next/dynamic"

// Dynamic imports for non-critical client components
// These must be in a separate Client Component file because Server Components
// don't allow { ssr: false } in Next.js 16+

export const Toaster = dynamic(
  () => import("@/shared/ui").then(m => ({ default: m.Toaster })),
  { ssr: false }
)

export const AuthInitializer = dynamic(
  () => import("@/features/auth/components").then(m => ({ default: m.AuthInitializer })),
  { ssr: false }
)

export const OfflineBannerWrapper = dynamic(
  () => import("@/shared/ui").then(m => ({ default: m.OfflineBannerWrapper })),
  { ssr: false }
)
