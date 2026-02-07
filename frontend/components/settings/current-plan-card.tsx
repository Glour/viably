"use client"

import { Crown, FolderKanban, Gem, CalendarClock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MOCK_USER_PLAN } from "@/lib/data/settings"

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${day}.${month}.${year}`
}

export function CurrentPlanCard() {
  // TODO: Replace with real API when backend plan endpoint is available
  const { plan, usage, renewalDate } = MOCK_USER_PLAN
  const projectLimitLabel =
    plan.projectLimit !== null ? String(plan.projectLimit) : "\u221E"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="size-5 text-primary" />
          Текущий план
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Plan name badge */}
        <div className="flex items-center gap-3">
          <Badge className="bg-[image:var(--gradient-main)] text-white border-0 text-sm px-3 py-1">
            {plan.name}
          </Badge>
          {plan.price !== null && plan.period && (
            <span className="text-sm text-muted-foreground">
              {plan.price.toLocaleString("ru-RU")} &#8381; / {plan.period === "month" ? "мес" : "год"}
            </span>
          )}
        </div>

        {/* Features */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          {plan.features.join(" \u00B7 ")}
        </div>

        {/* Usage stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
            <FolderKanban className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm">
              Проекты:{" "}
              <span className="font-semibold text-foreground">
                {usage.projectsUsed} / {projectLimitLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
            <Gem className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm">
              Кредиты:{" "}
              <span className="font-semibold text-foreground">
                {usage.creditsRemaining} осталось
              </span>
            </span>
          </div>
        </div>

        {/* Renewal date */}
        {renewalDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="size-4 shrink-0" />
            Следующее продление: {formatDate(renewalDate)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
