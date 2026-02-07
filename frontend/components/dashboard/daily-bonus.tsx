"use client"

import { useState, useCallback } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shimmer } from "@/components/ui/shimmer"
import { useDailyBonusStatus, useClaimDailyBonus } from "@/lib/hooks/use-credits"

export function DailyBonus() {
  const { data, isLoading } = useDailyBonusStatus()
  const claimMutation = useClaimDailyBonus()
  const [justClaimed, setJustClaimed] = useState(false)

  const handleClaim = useCallback(() => {
    claimMutation.mutate(undefined, {
      onSuccess: () => {
        setJustClaimed(true)
        setTimeout(() => setJustClaimed(false), 600)
      },
    })
  }, [claimMutation])

  if (isLoading) {
    return (
      <section>
        <Card>
          <CardContent className="p-6">
            <Shimmer width="60%" height="1.5rem" />
            <Shimmer className="mt-2" width="40%" height="1rem" />
            <Shimmer className="mt-4" height="0.5rem" />
            <Shimmer className="mt-4" width="8rem" height="2.5rem" />
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!data) return null

  const amount = data.amount ?? 5
  const claimedToday = data.claimedToday
  const streak = data.streakDays ?? 0
  const progressPercent = ((streak % 7) / 7) * 100

  return (
    <section>
      <Card
        className={cn(
          justClaimed && "animate-[glow-pulse_0.6s_ease-in-out]"
        )}
      >
        <CardContent className="p-6">
          {claimedToday ? (
            <>
              {/* Claimed state */}
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg font-semibold">
                  {"🎁"} +{amount} кредитов получено сегодня!
                </p>
                <Badge variant="success">
                  <Check className="size-3" />
                </Badge>
                {streak >= 7 && <Badge variant="default">x2</Badge>}
              </div>
            </>
          ) : (
            <>
              {/* Not claimed state */}
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg font-semibold">
                  {"🎁"} Получи +{amount} кредитов
                </p>
                {streak >= 7 && <Badge variant="default">x2</Badge>}
              </div>
            </>
          )}

          {/* Info line */}
          <p className="text-sm text-muted-foreground mt-1">
            Серия: {streak} дней подряд · Завтра: +{amount} кредитов
          </p>

          {/* Progress bar */}
          <div
            className="bg-muted rounded-full h-2 mt-4"
            role="progressbar"
            aria-valuenow={streak % 7}
            aria-valuemin={0}
            aria-valuemax={7}
            aria-label={`Прогресс серии: ${streak % 7} из 7 дней`}
          >
            <div
              className="bg-[image:var(--gradient-main)] rounded-full h-2 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Progress label */}
          <p className="text-xs text-muted-foreground mt-1">
            {streak % 7}/7 дней до бонуса x2
          </p>

          {/* Claim button — only when not claimed */}
          {!claimedToday && (
            <Button
              className="mt-4"
              onClick={handleClaim}
              disabled={claimMutation.isPending}
            >
              {claimMutation.isPending ? "Получаем..." : "Получить бонус"}
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
