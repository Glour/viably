"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/features/auth/stores"

export function AuthInitializer() {
  useEffect(() => {
    useAuthStore.getState().checkAuth()
  }, [])

  return null
}
