import { create } from "zustand"
import type { TemplatesStoreState, FilterTab } from "@/types"
import { getTemplates } from "@/lib/api/templates"

export const useTemplatesStore = create<TemplatesStoreState>((set, get) => ({
  templates: [],
  searchQuery: "",
  activeTab: "all" as FilterTab,
  isLoading: false,

  loadTemplates: async () => {
    set({ isLoading: true })

    const res = await getTemplates()

    set({
      templates: res.success ? res.templates : [],
      isLoading: false,
    })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setActiveTab: (tab: FilterTab) => {
    set({ activeTab: tab })
  },

  resetFilters: () => {
    set({ searchQuery: "", activeTab: "all" })
  },

  getFilteredTemplates: () => {
    const { templates, searchQuery, activeTab } = get()
    const query = searchQuery.toLowerCase()

    return templates.filter((t) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "telegram" && t.category === "telegram_bot") ||
        (activeTab === "popular" && t.isPopular) ||
        (activeTab === "cheap" && t.creditCost < 5)

      const matchesSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)

      return matchesTab && matchesSearch
    })
  },

  getTemplateBySlug: (slug: string) => {
    return get().templates.find((t) => t.slug === slug)
  },
}))
