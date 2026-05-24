"use client"

import { Sparkles } from "lucide-react"

import { Shimmer } from "@/shared/ui/shimmer"
import { useCurrentUser } from "@/entities/user"
import { useAuthStore } from "@/features/auth/stores"
import type { PlanType } from "@/shared/types"

export function WelcomeCard() {
  const { data: user, isLoading } = useCurrentUser(true)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) return null

  if (isLoading || !user) {
    return <Shimmer className="rounded-2xl h-28" />
  }

  const firstName = user.fullName?.split(" ")[0] || user.email.split("@")[0]
  const plan = (user?.plan ?? "free") as PlanType

  return (
    <div className="relative overflow-hidden rounded-2xl px-6 py-5 md:px-8 md:py-6 bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-50 dark:from-violet-950/60 dark:via-[#1a1030] dark:to-[#0F0F1A] border border-violet-200/60 dark:border-violet-500/20">
      {/* Aurora blobs */}
      <div className="absolute -top-10 right-10 w-72 h-72 bg-violet-400/20 dark:bg-violet-600/30 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-10 -right-20 w-56 h-56 bg-indigo-400/15 dark:bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-20 left-20 w-64 h-64 bg-purple-400/15 dark:bg-violet-800/25 rounded-full blur-[70px] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold text-violet-900 dark:text-white">
              Привет, {firstName}!
            </h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-200/60 text-violet-700 dark:bg-white/10 dark:text-white/50 uppercase tracking-wider">
              {plan}
            </span>
          </div>
          <p className="text-violet-600/70 dark:text-white/50 text-sm">
            Создайте что-нибудь крутое сегодня
          </p>
        </div>
      </div>
    </div>
  )
}
