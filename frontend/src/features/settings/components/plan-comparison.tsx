"use client"

import { PlanCard } from "@/features/settings/components/plan-card"
import { AVAILABLE_PLANS } from "@/shared/lib/data/settings"
import { useAuthStore } from "@/features/auth/stores"

export function PlanComparison() {
  const user = useAuthStore((s) => s.user)
  const availablePlans = AVAILABLE_PLANS
  const currentTier = user?.plan ?? "free"

  // Find current plan by tier
  const currentPlan = availablePlans.find((p) => p.tier === currentTier)

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
        Сравнение планов
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {availablePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={currentPlan?.id === plan.id}
            currentTier={currentTier}
          />
        ))}
      </div>
    </div>
  )
}
