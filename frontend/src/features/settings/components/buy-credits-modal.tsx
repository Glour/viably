"use client"

import { useState } from "react"
import { Gem } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"
import { CREDIT_PACKAGES } from "@/shared/lib/data/settings"

interface BuyCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BuyCreditsModal({ open, onOpenChange }: BuyCreditsModalProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState("")

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedPackageId(null)
  }

  const selectedPackage = CREDIT_PACKAGES.find((p) => p.id === selectedPackageId)
  const customAmountNum = parseInt(customAmount, 10)
  const totalCredits = selectedPackage?.credits ?? (isNaN(customAmountNum) ? 0 : customAmountNum)
  const totalPrice = selectedPackage?.price ?? (isNaN(customAmountNum) ? 0 : Math.round(customAmountNum * 8.9))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Купить кредиты</DialogTitle>
          <DialogDescription>
            Выберите пакет или введите нужное количество
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Package cards */}
          <div className="grid gap-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => handlePackageSelect(pkg.id)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 transition-colors text-left",
                  selectedPackageId === pkg.id
                    ? "border-primary bg-primary-subtle"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Gem className="size-5 text-primary" />
                  <div>
                    <span className="font-semibold">{pkg.credits} кредитов</span>
                    {pkg.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {pkg.badge === "popular" ? "Популярный" : "Лучшая цена"}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="font-mono font-semibold">{pkg.price} ₽</span>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label>Другое количество</Label>
            <Input
              type="number"
              placeholder="Введите количество (от 10)"
              min={10}
              max={10000}
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
            />
          </div>

          {/* Payment method placeholder */}
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Способ оплаты будет доступен в следующей версии
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button disabled={totalCredits === 0}>
            {totalCredits > 0
              ? `Купить ${totalCredits} кредитов за ${totalPrice} ₽`
              : "Выберите пакет"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
