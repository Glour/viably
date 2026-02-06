"use client"

import { useEffect } from "react"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { CurrentPlanCard } from "@/components/settings/current-plan-card"
import { PlanComparison } from "@/components/settings/plan-comparison"
import { useSettingsStore } from "@/stores/settings"

export default function PlanSettingsPage() {
  const { loadPlan } = useSettingsStore()

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  return (
    <div className="space-y-6">
      <FadeInUp delay={0}>
        <CurrentPlanCard />
      </FadeInUp>
      <FadeInUp delay={0.1}>
        <PlanComparison />
      </FadeInUp>
    </div>
  )
}
