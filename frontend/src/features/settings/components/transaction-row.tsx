"use client"

import type { CreditTransaction } from "@/shared/types"
import { formatRelativeTime } from "@/shared/lib/utils/format-relative-time"
import { cn } from "@/shared/lib/utils"

interface TransactionRowProps {
  transaction: CreditTransaction
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isPositive = transaction.amount > 0

  return (
    <div className="group flex items-center justify-between px-4 py-4 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/40 hover:bg-card hover:border-primary/30 transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            "flex items-center justify-center size-10 rounded-xl font-mono text-sm font-bold tabular-nums shrink-0 transition-all duration-300 group-hover:scale-110",
            isPositive
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          )}
        >
          {isPositive ? "+" : "−"}{Math.abs(transaction.amount)}
        </div>
        <span className="text-sm font-medium truncate group-hover:text-foreground transition-colors duration-300">
          {transaction.description}
        </span>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-4 font-medium">
        {formatRelativeTime(transaction.createdAt)}
      </span>
    </div>
  )
}
