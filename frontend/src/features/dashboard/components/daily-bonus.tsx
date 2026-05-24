"use client"

import { useState, useCallback, useRef } from "react"
import { Check, Gift, Flame } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Shimmer } from "@/shared/ui/shimmer"
import { useDailyBonusStatus, useClaimDailyBonus } from "@/entities/credit"
import { useComponentCleanup } from "@/shared/hooks/useComponentCleanup"

export function DailyBonus() {
  const { data, isLoading } = useDailyBonusStatus(true)
  const claimMutation = useClaimDailyBonus()
  const [justClaimed, setJustClaimed] = useState(false)
  const { registerSubscription, cleanupSubscription } = useComponentCleanup('DailyBonus')
  const subscriptionIdRef = useRef<string | null>(null)

  const handleClaim = useCallback(() => {
    claimMutation.mutate(undefined, {
      onSuccess: () => {
        if (subscriptionIdRef.current) {
          cleanupSubscription(subscriptionIdRef.current)
        }
        setJustClaimed(true)
        const timeoutId = setTimeout(() => setJustClaimed(false), 600)
        subscriptionIdRef.current = registerSubscription({
          type: 'timer',
          createdAt: Date.now(),
          cleanupFn: () => clearTimeout(timeoutId),
          metadata: { duration: 600, action: 'claim-animation-reset' }
        })
      },
    })
  }, [claimMutation, registerSubscription, cleanupSubscription])

  if (isLoading) {
    return (
      <section>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
          <Shimmer width="60%" height="1.75rem" />
          <Shimmer className="mt-2" width="40%" height="1rem" />
          <Shimmer className="mt-4 rounded-full" height="0.5rem" />
          <Shimmer className="mt-4 rounded-lg" width="9rem" height="2.5rem" />
        </div>
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
      <div
        className={cn(
          "rounded-2xl p-6",
          "bg-[var(--surface)] border border-[var(--border-subtle)]",
          "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
          "transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-lg",
          justClaimed && "shadow-lg border-primary/50 scale-[1.005]"
        )}
      >
        {claimedToday ? (
          <>
            <div className="flex items-center gap-2.5 mb-1.5">
              <Gift className="size-5 text-success" />
              <h3 className="font-heading text-xl font-bold">
                +{amount} кредитов получено!
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="success" className="text-xs font-semibold">
                <Check className="size-3 mr-1" />
                Бонус активирован
              </Badge>
              {streak >= 7 && (
                <Badge variant="default" className="text-xs font-semibold">
                  <Flame className="size-3 mr-1" />
                  x2 множитель
                </Badge>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-1.5">
              <Gift className="size-5 text-primary" />
              <h3 className="font-heading text-xl font-bold">
                Получи +{amount} кредитов
              </h3>
            </div>
            {streak >= 7 && (
              <div className="mb-3">
                <Badge variant="default" className="text-xs font-semibold">
                  <Flame className="size-3 mr-1" />
                  x2 множитель активен
                </Badge>
              </div>
            )}
          </>
        )}

        {/* Streak info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Flame className="size-3.5 text-warning" />
            <span className="font-medium">Серия: {streak} дней</span>
          </div>
          <span className="text-muted-foreground/40">·</span>
          <span>Завтра: +{amount} кредитов</span>
        </div>

        {/* Progress bar */}
        <div
          className="bg-muted/50 rounded-full h-2 overflow-hidden mb-2"
          role="progressbar"
          aria-valuenow={streak % 7}
          aria-valuemin={0}
          aria-valuemax={7}
        >
          <div
            className="bg-[image:var(--gradient-main)] rounded-full h-2 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {streak % 7}/7 дней до бонуса x2
        </p>

        {!claimedToday && (
          <Button
            size="default"
            className="h-11 px-6 text-sm font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_12px_var(--primary-glow)] transition-all duration-200 hover:bg-[position:100%_100%] hover:shadow-[0_0_20px_var(--primary-glow)] hover:-translate-y-0.5 disabled:opacity-50"
            onClick={handleClaim}
            disabled={claimMutation.isPending}
          >
            <Gift className="size-4 mr-2" />
            {claimMutation.isPending ? "Получаем..." : "Получить бонус"}
          </Button>
        )}
      </div>
    </section>
  )
}
