"use client"

import { Gem } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { useCreditBalance, useDailyBonusStatus } from "@/entities/credit"

interface CreditBalanceCardProps {
  onBuyClick: () => void
}

export function CreditBalanceCard({ onBuyClick }: CreditBalanceCardProps) {
  const { data: creditBalance } = useCreditBalance(true)
  const { data: bonusStatus } = useDailyBonusStatus(true)

  return (
    <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-8 overflow-hidden group">
      {/* Hover glow orbs */}
      <div className="absolute inset-0 bg-[image:var(--gradient-main)] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--primary-glow)] blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-primary-subtle/50 border border-primary/20">
              <Gem className="size-8 text-primary" />
            </div>
            <div>
              <p className="font-body text-sm font-medium text-muted-foreground mb-1">Баланс кредитов</p>
              <span className="font-code text-4xl md:text-5xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
                {creditBalance?.credits ?? 0}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="secondary"
              className="uppercase font-body font-semibold bg-primary-subtle border border-primary/20 text-primary"
            >
              {creditBalance?.plan ?? "free"}
            </Badge>
            <span className="font-body text-sm text-muted-foreground">
              +{bonusStatus?.amount ?? 5} сегодня (серия: {bonusStatus?.streakDays ?? 0} дней)
            </span>
          </div>
        </div>
        <Button
          onClick={onBuyClick}
          size="lg"
          className="h-12 px-8 text-base font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_20px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_32px_var(--primary-glow)] hover:scale-105 whitespace-nowrap"
        >
          Купить кредиты →
        </Button>
      </div>
    </div>
  )
}
