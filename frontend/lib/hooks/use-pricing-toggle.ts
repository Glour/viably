"use client"

import { useState, useEffect } from "react"

export type BillingPeriod = "monthly" | "yearly"

const STORAGE_KEY = "viably_pricing_period"

export function usePricingToggle() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "monthly" || saved === "yearly") {
        setPeriod(saved)
      }
    } catch {
      // localStorage may be unavailable (e.g. private browsing)
    }
  }, [])

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
