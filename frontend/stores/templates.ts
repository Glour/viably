import { create } from "zustand"
import type { FilterTab } from "@/types"

interface TemplatesUIState {
  searchQuery: string
  activeTab: FilterTab
  setSearchQuery: (query: string) => void
  setActiveTab: (tab: FilterTab) => void
  resetFilters: () => void
}

export const useTemplatesStore = create<TemplatesUIState>((set) => ({
  searchQuery: "",
  activeTab: "all" as FilterTab,
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setActiveTab: (tab: FilterTab) => set({ activeTab: tab }),
  resetFilters: () => set({ searchQuery: "", activeTab: "all" }),
}))
