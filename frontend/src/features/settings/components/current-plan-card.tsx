"use client"

import Link from "next/link"
import { Crown, FolderKanban, Gem, CalendarClock, ArrowRight } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { AVAILABLE_PLANS } from "@/shared/lib/data/settings"
import { useCreditBalance } from "@/entities/credit"
import { useProjects } from "@/entities/project"
import { useAuthStore } from "@/features/auth/stores"

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${day}.${month}.${year}`
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-7 w-20 bg-muted rounded" />
        <div className="h-5 w-32 bg-muted rounded" />
      </div>
      <div className="h-10 w-full bg-muted rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-12 w-full bg-muted rounded-lg" />
        <div className="h-12 w-full bg-muted rounded-lg" />
      </div>
    </div>
  )
}

export function CurrentPlanCard() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: creditData, isLoading: isLoadingCredits } = useCreditBalance(isAuthenticated)
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects(isAuthenticated, { page: 1, perPage: 1 })

  // Loading state
  if (isLoadingCredits || isLoadingProjects || !user) {
    return (
      <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-8">
        <div className="mb-6">
          <h3 className="flex items-center gap-3 font-heading text-2xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
            <Crown className="size-6 text-primary" />
            Текущий план
          </h3>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  // Find the plan matching the user's tier
  const plan = AVAILABLE_PLANS.find((p) => p.tier === user.plan) || AVAILABLE_PLANS[0]
  const deployLimitLabel = plan.deployLimit !== null ? String(plan.deployLimit) : "\u221E"
  const deploysUsed = projectsData?.total ?? 0
  const creditsRemaining = creditData?.credits ?? user.credits

  // For free plan, show renewal date as null (no subscription)
  const renewalDate = user.plan !== "free" ? null : null // TODO: Add renewal date from backend when available

  return (
    <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-8 overflow-hidden group">
      {/* Hover glow orbs */}
      <div className="absolute inset-0 bg-[image:var(--gradient-main)] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--primary-glow)] blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <h3 className="flex items-center gap-3 font-heading text-2xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
          <Crown className="size-6 text-primary" />
          Текущий план
        </h3>
      </div>

      <div className="relative z-10 space-y-6">
        {/* Plan name badge */}
        <div className="flex items-center gap-3">
          <Badge className="bg-[image:var(--gradient-main)] text-white border-0 font-heading text-base font-semibold px-4 py-2 shadow-[0_0_16px_var(--primary-glow)]">
            {plan.name}
          </Badge>
          {plan.price !== null && plan.period && (
            <span className="font-body text-base font-medium text-muted-foreground">
              {plan.price.toLocaleString("ru-RU")} &#8381; / {plan.period === "month" ? "мес" : "год"}
            </span>
          )}
        </div>

        {/* Features */}
        <div className="font-body text-base leading-relaxed text-muted-foreground">
          {(plan.features ?? []).join(" • ")}
        </div>

        {/* Usage stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 px-4 py-3 transition-all duration-300 hover:bg-card hover:border-primary/30 hover:scale-[1.02]">
            <FolderKanban className="size-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs text-muted-foreground mb-0.5">Деплои</p>
              <p className="font-code font-semibold text-foreground">
                {deploysUsed} / {deployLimitLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 px-4 py-3 transition-all duration-300 hover:bg-card hover:border-primary/30 hover:scale-[1.02]">
            <Gem className="size-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs text-muted-foreground mb-0.5">Кредиты</p>
              <p className="font-code font-semibold text-foreground">
                {creditsRemaining} осталось
              </p>
            </div>
          </div>
        </div>

        {/* Renewal date */}
        {renewalDate && (
          <div className="flex items-center gap-2 font-body text-sm text-muted-foreground px-4 py-3 rounded-2xl bg-primary-subtle/50 border border-primary/20">
            <CalendarClock className="size-4 shrink-0" />
            Следующее продление: {formatDate(renewalDate)}
          </div>
        )}

        {/* Manage subscription link */}
        <Link
          href="/subscription"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors"
        >
          Управление подпиской
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
