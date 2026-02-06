"use client"

import { useEffect, useState, useCallback } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDailyBonusStore } from "@/stores/daily-bonus"

export function DailyBonus() {
  const store = useDailyBonusStore()
  const [justClaimed, setJustClaimed] = useState(false)

  useEffect(() => {
    store.checkStreak()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClaim = useCallback(() => {
    store.claim()
    setJustClaimed(true)
    setTimeout(() => setJustClaimed(false), 600)
  }, [store])

  const progressPercent = ((store.streak % 7) / 7) * 100

  return (
    <section>
      <Card
        className={cn(
          justClaimed && "animate-[glow-pulse_0.6s_ease-in-out]"
        )}
      >
        <CardContent className="p-6">
          {store.claimedToday ? (
            <>
              {/* Claimed state */}
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg font-semibold">
                  {"🎁"} +{store.todayReward} кредитов получено сегодня!
                </p>
                <Badge variant="success">
                  <Check className="size-3" />
                </Badge>
                {store.streak >= 7 && <Badge variant="default">x2</Badge>}
              </div>
            </>
          ) : (
            <>
              {/* Not claimed state */}
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg font-semibold">
                  {"🎁"} Получи +{store.todayReward} кредитов
                </p>
                {store.streak >= 7 && <Badge variant="default">x2</Badge>}
              </div>
            </>
          )}

          {/* Info line */}
          <p className="text-sm text-muted-foreground mt-1">
            Серия: {store.streak} дней подряд · Завтра: +{store.nextReward}{" "}
            кредитов
          </p>

          {/* Progress bar */}
          <div className="bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-[image:var(--gradient-main)] rounded-full h-2 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Progress label */}
          <p className="text-xs text-muted-foreground mt-1">
            {store.streak % 7}/7 дней до бонуса x2
          </p>

          {/* Claim button — only when not claimed */}
          {!store.claimedToday && (
            <Button className="mt-4" onClick={handleClaim}>
              Получить бонус
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
