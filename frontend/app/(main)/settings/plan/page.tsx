"use client"

import { FadeInUp } from "@/components/motion/fade-in-up"
import { CurrentPlanCard } from "@/components/settings/current-plan-card"
import { PlanComparison } from "@/components/settings/plan-comparison"

export default function PlanSettingsPage() {
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
