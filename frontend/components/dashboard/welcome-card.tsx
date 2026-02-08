"use client"

import Link from "next/link"
import { Gem } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shimmer } from "@/components/ui/shimmer"
import { useCountUp } from "@/hooks/use-count-up"
import { useCurrentUser } from "@/lib/hooks/use-user"
import { useCreditBalance } from "@/lib/hooks/use-credits"
import type { PlanType } from "@/types"

const planBadgeVariant: Record<
  PlanType,
  "default" | "secondary"
> = {
  free: "secondary",
  starter: "default",
  pro: "default",
  business: "default",
}

export function WelcomeCard() {
  const { data: user, isLoading: isLoadingUser } = useCurrentUser()
  const { data: balance, isLoading: isLoadingBalance } = useCreditBalance()

  const credits = balance?.credits ?? user?.credits ?? 0
  const plan = (balance?.plan ?? user?.plan ?? "free") as PlanType
  const animatedCredits = useCountUp(credits)

  const isLoading = isLoadingUser || isLoadingBalance

  if (isLoading || !user) {
    return (
      <div className="relative rounded-2xl p-6 bg-[var(--primary-subtle)] overflow-hidden">
        <Shimmer width="40%" height="1.75rem" />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Shimmer className="rounded-xl" height="6rem" />
        </div>
        <div className="flex gap-3 mt-6">
          <Shimmer width="10rem" height="2.5rem" className="rounded-md" />
          <Shimmer width="12rem" height="2.5rem" className="rounded-md" />
        </div>
      </div>
    )
  }

  const displayName = user.fullName || user.email.split("@")[0]

  return (
    <div className="relative rounded-2xl p-6 bg-[var(--primary-subtle)] overflow-hidden">
      {/* Glow orb */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-64 h-64 -translate-y-1/2 translate-x-1/2 bg-[var(--primary-glow)] blur-3xl rounded-full opacity-30 pointer-events-none"
      />

      {/* Greeting */}
      <h2 className="font-heading text-2xl font-bold truncate max-w-full sm:max-w-[300px]">
        Привет, {displayName}!
      </h2>

      {/* Stat card */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {/* Credits */}
        <div
          className="bg-card/60 backdrop-blur-sm border rounded-xl p-4 flex-1 min-w-0"
          aria-label={`Баланс кредитов: ${credits}`}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gem className="size-4 shrink-0" />
            <span>Кредитов</span>
          </div>
          <p className="font-code text-2xl font-bold mt-1">
            {animatedCredits}
          </p>
          <div className="mt-1">
            <Badge variant={planBadgeVariant[plan]}>
              {plan}
            </Badge>
          </div>
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
