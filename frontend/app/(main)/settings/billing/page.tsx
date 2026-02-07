"use client"

import { useState } from "react"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { CreditBalanceCard } from "@/components/settings/credit-balance-card"
import { BuyCreditsModal } from "@/components/settings/buy-credits-modal"
import { TransactionHistory } from "@/components/settings/transaction-history"

export default function BillingSettingsPage() {
  const [buyModalOpen, setBuyModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <FadeInUp delay={0}>
        <CreditBalanceCard onBuyClick={() => setBuyModalOpen(true)} />
      </FadeInUp>
      <FadeInUp delay={0.1}>
        <TransactionHistory />
      </FadeInUp>
      <BuyCreditsModal open={buyModalOpen} onOpenChange={setBuyModalOpen} />
    </div>
  )
}
