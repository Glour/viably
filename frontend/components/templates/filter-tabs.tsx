"use client"

import type { FilterTab } from "@/types"
import { cn } from "@/lib/utils"
import { useTemplatesStore } from "@/stores/templates"

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "telegram", label: "Telegram" },
  { id: "popular", label: "Популярные" },
  { id: "cheap", label: "Дешёвые < 5 cr." },
]

export function FilterTabs() {
  const activeTab = useTemplatesStore((s) => s.activeTab)
  const setActiveTab = useTemplatesStore((s) => s.setActiveTab)

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Фильтры шаблонов">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            activeTab === tab.id
              ? "bg-[image:var(--gradient-main)] text-white shadow-md"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
