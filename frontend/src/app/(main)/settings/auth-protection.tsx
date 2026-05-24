"use client"

import { ProtectedRoute } from "@/features/auth/components/protected-route"

export function AuthProtection({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}
