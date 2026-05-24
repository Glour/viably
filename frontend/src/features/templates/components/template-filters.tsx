"use client"

import type { FilterTab, SortOption } from "@/shared/types"
import { cn } from "@/shared/lib/utils"
import { useTemplatesStore } from "@/features/templates/stores"
import { ArrowUpDown } from "lucide-react"

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "business", label: "Для бизнеса" },
  { id: "community", label: "Для сообщества" },
  { id: "personal", label: "Личное" },
]

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "popular", label: "Популярные" },
  { id: "newest", label: "Новые" },
]

export function FilterTabs() {
  const activeTab = useTemplatesStore((s) => s.activeTab)
  const setActiveTab = useTemplatesStore((s) => s.setActiveTab)
  const sortBy = useTemplatesStore((s) => s.sortBy)
  const setSortBy = useTemplatesStore((s) => s.setSortBy)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Фильтры шаблонов">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === tab.id
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-transparent text-muted-foreground border border-border/50 hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="size-4 text-muted-foreground" />
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                sortBy === opt.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
