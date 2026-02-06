"use client"

import Link from "next/link"
import { Gem, FolderKanban, Rocket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCountUp } from "@/hooks/use-count-up"
import type { UserProfile } from "@/types"

const planBadgeVariant: Record<
  UserProfile["plan"],
  "default" | "secondary"
> = {
  free: "secondary",
  pro: "default",
  business: "default",
}

interface WelcomeCardProps {
  user: UserProfile
}

export function WelcomeCard({ user }: WelcomeCardProps) {
  const animatedCredits = useCountUp(user.credits)
  const animatedProjects = useCountUp(user.projectsCount)
  const animatedDeployed = useCountUp(user.deployedCount)

  const atProjectLimit = user.projectsCount >= user.projectsLimit

  return (
    <div className="relative rounded-2xl p-6 bg-[var(--primary-subtle)] overflow-hidden">
      {/* Glow orb */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-64 h-64 -translate-y-1/2 translate-x-1/2 bg-[var(--primary-glow)] blur-3xl rounded-full opacity-30 pointer-events-none"
      />

      {/* Greeting */}
      <h2 className="font-heading text-2xl font-bold truncate max-w-[300px]">
        Привет, {user.name}!
      </h2>

      {/* Stat cards */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {/* Credits */}
        <div
          className="bg-card/60 backdrop-blur-sm border rounded-xl p-4 flex-1 min-w-0"
          aria-label={`Баланс кредитов: ${user.credits}`}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gem className="size-4 shrink-0" />
            <span>Кредитов</span>
          </div>
          <p className="font-code text-2xl font-bold mt-1">
            {animatedCredits}
          </p>
          <div className="mt-1">
            <Badge variant={planBadgeVariant[user.plan]}>
              {user.plan}
            </Badge>
          </div>
        </div>

        {/* Projects */}
        <div
          className="bg-card/60 backdrop-blur-sm border rounded-xl p-4 flex-1 min-w-0"
          aria-label={`Проектов: ${user.projectsCount} из ${user.projectsLimit}`}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderKanban className="size-4 shrink-0" />
            <span>Проектов</span>
          </div>
          <p className="font-code text-2xl font-bold mt-1">
            {animatedProjects}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            из {user.projectsLimit}
            {atProjectLimit && (
              <span className="text-destructive"> (лимит)</span>
            )}
          </p>
        </div>

        {/* Deployed */}
        <div
          className="bg-card/60 backdrop-blur-sm border rounded-xl p-4 flex-1 min-w-0"
          aria-label={`Deployed: ${user.deployedCount} из ${user.projectsCount}`}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Rocket className="size-4 shrink-0" />
            <span>Deployed</span>
          </div>
          <p className="font-code text-2xl font-bold mt-1">
            {animatedDeployed}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            из {user.projectsCount}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button asChild>
          <Link href="/projects/new">Создать проект</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/credits">Пополнить кредиты &rarr;</Link>
        </Button>
      </div>
    </div>
  )
}
