"use client"

import dynamic from "next/dynamic"

import { FadeInUp } from "@/shared/components/motion/fade-in-up"
import { Shimmer } from "@/shared/ui/shimmer"

const WelcomeCard = dynamic(
  () => import("@/features/dashboard/components").then((m) => ({ default: m.WelcomeCard })),
  { ssr: false, loading: () => <Shimmer className="h-24 rounded-2xl" /> }
)

const StatsCards = dynamic(
  () => import("@/features/dashboard/components").then((m) => ({ default: m.StatsCards })),
  { ssr: false, loading: () => <Shimmer className="h-24 rounded-2xl" /> }
)

const RecentProjects = dynamic(
  () => import("@/features/dashboard/components").then((m) => ({ default: m.RecentProjects })),
  { ssr: false, loading: () => <Shimmer className="h-28 rounded-2xl" /> }
)

const QuickStartTemplates = dynamic(
  () => import("@/features/dashboard/components").then((m) => ({ default: m.QuickStartTemplates })),
  { ssr: false, loading: () => <Shimmer className="h-48 rounded-2xl" /> }
)

const DailyBonus = dynamic(
  () => import("@/features/dashboard/components").then((m) => ({ default: m.DailyBonus })),
  { ssr: false, loading: () => <Shimmer className="h-36 rounded-2xl" /> }
)

export function DashboardContent() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Hero banner */}
      <FadeInUp delay={0}>
        <WelcomeCard />
      </FadeInUp>

      {/* Stats: 4 cards */}
      <FadeInUp delay={0.05}>
        <StatsCards />
      </FadeInUp>

      {/* Recent projects — compact 3 */}
      <FadeInUp delay={0.1}>
        <RecentProjects />
      </FadeInUp>

      {/* Quick start templates */}
      <FadeInUp delay={0.15}>
        <QuickStartTemplates />
      </FadeInUp>

      {/* Daily bonus */}
      <FadeInUp delay={0.2}>
        <DailyBonus />
      </FadeInUp>
    </div>
  )
}
