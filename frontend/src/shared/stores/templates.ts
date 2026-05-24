import { create } from "zustand"
import type { FilterTab, SortOption } from "@/shared/types"

interface TemplatesUIState {
  searchQuery: string
  activeTab: FilterTab
  sortBy: SortOption
  setSearchQuery: (query: string) => void
  setActiveTab: (tab: FilterTab) => void
  setSortBy: (sort: SortOption) => void
  resetFilters: () => void
  reset: () => void
}

export const useTemplatesStore = create<TemplatesUIState>((set) => ({
  searchQuery: "",
  activeTab: "all" as FilterTab,
  sortBy: "popular" as SortOption,
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setActiveTab: (tab: FilterTab) => set({ activeTab: tab }),
  setSortBy: (sort: SortOption) => set({ sortBy: sort }),
  resetFilters: () => set({ searchQuery: "", activeTab: "all", sortBy: "popular" }),
  reset: () => set({ searchQuery: "", activeTab: "all", sortBy: "popular" }),
}))
