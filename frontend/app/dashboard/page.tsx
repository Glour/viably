"use client"

import { useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { WelcomeCard } from "@/components/dashboard/welcome-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentProjects } from "@/components/dashboard/recent-projects"
import { DailyBonus } from "@/components/dashboard/daily-bonus"
import { Shimmer } from "@/components/ui/shimmer"
import { useDashboardStore } from "@/stores/dashboard"

export default function DashboardPage() {
  const { user, projects, isLoading, loadDashboard } = useDashboardStore()

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return (
    <MainLayout>
      <div className="space-y-8">
        <FadeInUp delay={0}>
          {isLoading || !user ? (
            <div className="rounded-2xl bg-muted p-6">
              <Shimmer width="40%" height="1.5rem" />
              <Shimmer className="mt-3" width="60%" height="1rem" />
              <Shimmer className="mt-3" width="30%" height="1rem" />
            </div>
          ) : (
            <WelcomeCard user={user} />
          )}
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <QuickActions />
        </FadeInUp>

        <FadeInUp delay={0.2}>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Shimmer className="rounded-2xl" height="8rem" />
              <Shimmer className="rounded-2xl" height="8rem" />
              <Shimmer className="rounded-2xl" height="8rem" />
            </div>
          ) : (
            <RecentProjects projects={projects} />
          )}
        </FadeInUp>

        <FadeInUp delay={0.3}>
          <DailyBonus />
        </FadeInUp>
      </div>
    </MainLayout>
  )
}
