"use client"

import { useState } from "react"

export type BillingPeriod = "monthly" | "yearly"

const STORAGE_KEY = "viably_pricing_period"

export function usePricingToggle() {
  const [period, setPeriod] = useState<BillingPeriod>(() => {
    if (typeof window === "undefined") return "monthly"
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "monthly" || saved === "yearly") {
        return saved
      }
    } catch {
      // localStorage may be unavailable (e.g. private browsing)
    }
    return "monthly"
  })

  const togglePeriod = (next: BillingPeriod) => {
    setPeriod(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Silent fail if storage is unavailable
    }
  }

  return { period, togglePeriod } as const
}
