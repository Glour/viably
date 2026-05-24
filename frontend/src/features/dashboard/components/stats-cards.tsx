"use client"

import { FolderOpen, Rocket, Sparkles, Gem } from "lucide-react"

import { Shimmer } from "@/shared/ui/shimmer"
import { useCountUp } from "@/shared/hooks/use-count-up"
import { useAuthStore } from "@/features/auth/stores"
import { useProjects } from "@/entities/project"
import { useCreditBalance } from "@/entities/credit"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  isLoading?: boolean
  accent?: string
}

function StatCard({ icon, label, value, isLoading, accent = "text-violet-500 dark:text-violet-400" }: StatCardProps) {
  const animated = useCountUp(typeof value === "number" ? value : 0)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4">
        <Shimmer width="1.5rem" height="1.5rem" className="rounded-lg mb-3" />
        <Shimmer width="40%" height="1.75rem" className="mb-1.5" />
        <Shimmer width="60%" height="0.875rem" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`mb-3 ${accent}`}>{icon}</div>
      <div className="text-2xl font-bold text-foreground tabular-nums">
        {typeof value === "number" ? animated : value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

export function StatsCards() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: projects, isLoading: isLoadingProjects } = useProjects(isAuthenticated, { page: 1, perPage: 100 })
  const { data: balance, isLoading: isLoadingBalance } = useCreditBalance(isAuthenticated)

  const total = projects?.total ?? 0
  const deployed = projects?.items.filter((p) => p.status === "deployed").length ?? 0
  const generated = projects?.items.filter((p) => ["generated", "deployed"].includes(p.status)).length ?? 0
  const credits = balance?.credits ?? 0

  const isLoading = isLoadingProjects || isLoadingBalance

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={<FolderOpen className="size-5" />}
        label="Всего проектов"
        value={total}
        isLoading={isLoading}
        accent="text-violet-500 dark:text-violet-400"
      />
      <StatCard
        icon={<Rocket className="size-5" />}
        label="Запущено"
        value={deployed}
        isLoading={isLoading}
        accent="text-emerald-500 dark:text-emerald-400"
      />
      <StatCard
        icon={<Sparkles className="size-5" />}
        label="Сгенерировано"
        value={generated}
        isLoading={isLoading}
        accent="text-blue-500 dark:text-blue-400"
      />
      <StatCard
        icon={<Gem className="size-5" />}
        label="Кредиты"
        value={credits}
        isLoading={isLoadingBalance}
        accent="text-amber-500 dark:text-amber-400"
      />
    </div>
  )
}
