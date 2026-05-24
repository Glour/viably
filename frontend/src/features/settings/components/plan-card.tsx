"use client"

import { Check } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import type { SubscriptionPlan, PlanTier } from "@/shared/types"

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
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border overflow-hidden group transition-all duration-500",
        isCurrent
          ? "border-primary/60 bg-gradient-to-br from-primary/10 via-primary-subtle to-primary/5 backdrop-blur-xl shadow-[0_0_32px_var(--primary-glow)]"
          : "border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl hover:border-primary/40 hover:shadow-[0_0_24px_var(--primary-glow)] hover:scale-[1.02]"
      )}
    >
      {/* Hover glow orbs */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-500",
        isCurrent ? "bg-[image:var(--gradient-main)] opacity-5" : "bg-[image:var(--gradient-cool)] opacity-0 group-hover:opacity-5"
      )} />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-glow)] blur-[50px] opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative z-10 p-6 pb-4">
        {(plan.isPopular || plan.isEarlyBird) && (
          <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
            {plan.isPopular && (
              <Badge className="bg-[image:var(--gradient-warm)] text-white border-0 font-body font-semibold shadow-[0_0_12px_var(--primary-glow)]">
                ★ Популярный
              </Badge>
            )}
            {plan.isEarlyBird && (
              <Badge className="bg-[image:var(--gradient-cool)] text-white border-0 font-body font-semibold shadow-[0_0_12px_var(--primary-glow)]">
                ● Early Bird
              </Badge>
            )}
          </div>
        )}
        <h3 className="font-heading text-2xl font-bold mb-4">{plan.name}</h3>
        <div>
          {plan.price === null ? (
            <span className="font-heading text-2xl font-semibold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">По запросу</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="font-code text-4xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">{plan.price}</span>
              <span className="font-body text-base font-medium text-muted-foreground">₽/мес</span>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 flex-1 px-6 pb-6">
        <ul className="space-y-3">
          {(plan.features ?? []).map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 font-body text-sm leading-relaxed group/item">
              <Check className="size-4 shrink-0 mt-0.5 text-success transition-transform duration-300 group-hover/item:scale-110" />
              <span className="group-hover/item:text-foreground transition-colors duration-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-6 pt-4">
        {isCurrent ? (
          <Button className="w-full font-body font-medium" disabled>
            Текущий план
          </Button>
        ) : isEnterprise ? (
          <Button
            className="w-full h-11 font-body font-semibold bg-card/40 backdrop-blur-sm border-border/60 hover:bg-card hover:border-primary/50 transition-all duration-300"
            variant="outline"
          >
            Связаться с нами
          </Button>
        ) : isUpgrade ? (
          <Button
            className="w-full h-11 font-body font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_16px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_28px_var(--primary-glow)] hover:scale-[1.02]"
          >
            Перейти на {plan.name}
          </Button>
        ) : (
          <Button
            className="w-full h-11 font-body font-semibold bg-card/40 backdrop-blur-sm border-border/60 hover:bg-card hover:border-primary/50 transition-all duration-300"
            variant="outline"
          >
            Перейти на {plan.name}
          </Button>
        )}
      </div>

      {/* Gradient line bottom for current plan */}
      {isCurrent && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[image:var(--gradient-main)]" />
      )}
    </div>
  )
}
