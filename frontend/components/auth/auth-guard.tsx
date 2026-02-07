"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth"

/**
 * Redirects authenticated users away from auth pages (login, register, etc.)
 * to /dashboard. Works as client-side fallback alongside proxy.ts server check.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return null
  }

  return <>{children}</>
}
