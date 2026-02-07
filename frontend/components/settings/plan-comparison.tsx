"use client"

import { PlanCard } from "@/components/settings/plan-card"
import { AVAILABLE_PLANS, MOCK_USER_PLAN } from "@/lib/data/settings"

export function PlanComparison() {
  // TODO: Replace with real API when backend plan endpoint is available
  const currentPlan = MOCK_USER_PLAN
  const availablePlans = AVAILABLE_PLANS
  const currentTier = currentPlan.plan.tier

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Сравнение планов</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availablePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={currentPlan?.plan.id === plan.id}
            currentTier={currentTier}
          />
        ))}
      </div>
    </div>
  )
}
