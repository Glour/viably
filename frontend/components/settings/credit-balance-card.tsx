"use client"

import { Gem } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCreditBalance, useDailyBonusStatus } from "@/lib/hooks/use-credits"

interface CreditBalanceCardProps {
  onBuyClick: () => void
}

export function CreditBalanceCard({ onBuyClick }: CreditBalanceCardProps) {
  const { data: creditBalance } = useCreditBalance()
  const { data: bonusStatus } = useDailyBonusStatus()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-4xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
                <Gem className="inline size-8 text-primary mr-1" />
                {creditBalance?.credits ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase">
                {creditBalance?.plan ?? "free"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                +{bonusStatus?.amount ?? 5} today (streak: {bonusStatus?.streakDays ?? 0} days)
              </span>
            </div>
          </div>
          <Button
            onClick={onBuyClick}
            className="bg-[image:var(--gradient-main)] text-white hover:opacity-90 transition-opacity"
          >
            Купить кредиты →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
