"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth"

export function AuthInitializer() {
  useEffect(() => {
    useAuthStore.getState().checkAuth()
  }, [])

  return null
}
