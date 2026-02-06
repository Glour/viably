"use client"

import type { CreditTransaction } from "@/types"
import { formatRelativeTime } from "@/lib/utils/format-relative-time"
import { cn } from "@/lib/utils"

interface TransactionRowProps {
  transaction: CreditTransaction
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isPositive = transaction.amount > 0

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums w-16 shrink-0",
            isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}
        >
          {isPositive ? "+" : "−"}{Math.abs(transaction.amount)}
        </span>
        <span className="text-sm truncate">{transaction.description}</span>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-4">
        {formatRelativeTime(transaction.createdAt)}
      </span>
    </div>
  )
}
