"use client"

import { Check } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SubscriptionPlan, PlanTier } from "@/types"

interface PlanCardProps {
  plan: SubscriptionPlan
  isCurrent: boolean
  currentTier: PlanTier
}

const TIER_ORDER: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
  enterprise: 4,
}

export function PlanCard({ plan, isCurrent, currentTier }: PlanCardProps) {
  const isUpgrade = TIER_ORDER[plan.tier] > TIER_ORDER[currentTier]
  const isEnterprise = plan.tier === "enterprise"

  return (
    <Card
      className={cn(
        "flex flex-col",
        isCurrent && "ring-2 ring-primary border-primary bg-primary-subtle/30"
      )}
    >
      <CardHeader className="relative">
        {plan.isPopular && (
          <Badge className="absolute top-4 right-4">
            Популярный
          </Badge>
        )}
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <div className="mt-2">
          {plan.price === null ? (
            <span className="text-2xl font-semibold">По запросу</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground text-sm">₽/мес</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="size-4 shrink-0 mt-0.5 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrent ? (
          <Button className="w-full" disabled>
            Текущий план
          </Button>
        ) : isEnterprise ? (
          <Button className="w-full" variant="outline">
            Связаться с нами
          </Button>
        ) : isUpgrade ? (
          <Button className="w-full">
            Перейти на {plan.name}
          </Button>
        ) : (
          <Button className="w-full" variant="outline">
            Перейти на {plan.name}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
