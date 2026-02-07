"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionRow } from "@/components/settings/transaction-row"
import { useSettingsStore } from "@/stores/settings"
import { useCreditTransactions } from "@/lib/hooks/use-credits"
import { cn } from "@/lib/utils"
import type { TransactionFilter, CreditTransaction, TransactionType } from "@/types"

const filters: { label: string; value: TransactionFilter }[] = [
  { label: "Все", value: "all" },
  { label: "Начислено", value: "earned" },
  { label: "Потрачено", value: "spent" },
  { label: "Куплено", value: "purchased" },
]

export function TransactionHistory() {
  const { transactionFilter, setTransactionFilter } = useSettingsStore()
  const filterParam = transactionFilter === "all" ? undefined : transactionFilter
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useCreditTransactions(filterParam ? { type: filterParam } : undefined)

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
    <Card>
      <CardHeader>
        <CardTitle>История транзакций</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              onClick={() => setTransactionFilter(f.value)}
              className={cn(
                "rounded-lg whitespace-nowrap",
                transactionFilter === f.value &&
                  "bg-primary-subtle text-primary hover:bg-primary-subtle"
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Transaction list */}
        <div>
          {transactions.length === 0 && !isLoadingAny ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Нет транзакций
            </p>
          ) : (
            transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))
          )}
        </div>

        {/* Load more */}
        {hasNextPage && transactions.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Загрузить ещё
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
