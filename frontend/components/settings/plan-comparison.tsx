"use client"

import { useSettingsStore } from "@/stores/settings"
import { PlanCard } from "@/components/settings/plan-card"

export function PlanComparison() {
  const { currentPlan, availablePlans } = useSettingsStore()

  const currentTier = currentPlan?.plan.tier ?? "free"

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
