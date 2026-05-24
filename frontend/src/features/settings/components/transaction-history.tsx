"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { TransactionRow } from "@/features/settings/components/transaction-row"
import { useSettingsStore } from "@/features/settings/stores"
import { useAuthStore } from "@/features/auth/stores"
import { useCreditTransactions } from "@/entities/credit"
import { cn } from "@/shared/lib/utils"
import type { TransactionFilter, CreditTransaction, TransactionType } from "@/shared/types"

const filters: { label: string; value: TransactionFilter }[] = [
  { label: "Все", value: "all" },
  { label: "Начислено", value: "earned" },
  { label: "Потрачено", value: "spent" },
  { label: "Куплено", value: "purchased" },
]

export function TransactionHistory() {
  const { transactionFilter, setTransactionFilter } = useSettingsStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const filterParam = transactionFilter === "all" ? undefined : transactionFilter
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useCreditTransactions(isAuthenticated, filterParam ? { type: filterParam } : undefined)

  const transactions: CreditTransaction[] = (
    data?.pages.flatMap((page) => page.transactions) ?? []
  ).map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    type: tx.transactionType as TransactionType,
    description: tx.description ?? "",
    createdAt: tx.createdAt,
  }))

  const isLoadingAny = isLoading || isFetchingNextPage

  return (
    <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-8 overflow-hidden group">
      {/* Hover glow orbs */}
      <div className="absolute inset-0 bg-[image:var(--gradient-cool)] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative z-10 mb-6">
        <h3 className="font-heading text-2xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
          История транзакций
        </h3>
      </div>

      <div className="relative z-10 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              onClick={() => setTransactionFilter(f.value)}
              className={cn(
                "rounded-xl whitespace-nowrap font-semibold transition-all duration-300",
                transactionFilter === f.value
                  ? "bg-[image:var(--gradient-main)] text-white shadow-[0_0_12px_var(--primary-glow)]"
                  : "bg-card/40 backdrop-blur-sm border border-border/40 hover:bg-card hover:border-primary/30"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Transaction list */}
        <div className="space-y-2">
          {transactions.length === 0 && !isLoadingAny ? (
            <div className="rounded-2xl bg-card/40 backdrop-blur-sm border border-border/40 p-8 text-center">
              <p className="text-base text-muted-foreground">
                Нет транзакций
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))
          )}
        </div>

        {/* Load more */}
        {hasNextPage && transactions.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="h-11 px-6 font-semibold bg-card/40 backdrop-blur-sm border-border/60 hover:bg-card hover:border-primary/50 transition-all duration-300"
            >
              {isFetchingNextPage && (
                <Loader2 className="size-4 animate-spin mr-2" />
              )}
              Загрузить ещё
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
