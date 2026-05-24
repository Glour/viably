"use client"

import { Suspense } from "react"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { setTokens } from "@/shared/api/tokens"
import { useAuthStore } from "@/features/auth/stores/auth-store"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    const refreshToken = searchParams.get("refresh_token")

    if (token && refreshToken) {
      setTokens(token, refreshToken)
      useAuthStore.getState().checkAuth().then(() => {
        router.replace("/dashboard")
      })
    } else {
      router.replace("/login")
    }
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Выполняется вход...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Загрузка...</p></div>}>
      <CallbackContent />
    </Suspense>
  )
}
