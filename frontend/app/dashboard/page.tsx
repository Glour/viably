"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { WelcomeCard } from "@/components/dashboard/welcome-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentProjects } from "@/components/dashboard/recent-projects"
import { DailyBonus } from "@/components/dashboard/daily-bonus"

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <FadeInUp delay={0}>
          <WelcomeCard />
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <QuickActions />
        </FadeInUp>

        <FadeInUp delay={0.2}>
          <RecentProjects />
        </FadeInUp>

        <FadeInUp delay={0.3}>
          <DailyBonus />
        </FadeInUp>
      </div>
    </MainLayout>
  )
}
