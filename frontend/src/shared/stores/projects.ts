import { create } from "zustand"
import type { ProjectFilter, ProjectSort, ViewMode } from "@/shared/types"

/**
 * UI-only store for the projects list page.
 *
 * Data fetching and mutations are handled by React Query hooks
 * (`useProjects`, `useDeleteProject`, etc.) in `@/entities/project`.
 * This store only tracks ephemeral client-side UI state (search, filters,
 * sort order, view mode).
 */

interface ProjectsUIState {
  searchQuery: string
  filter: ProjectFilter
  sort: ProjectSort
  viewMode: ViewMode
  setSearchQuery: (query: string) => void
  setFilter: (filter: ProjectFilter) => void
  setSort: (sort: ProjectSort) => void
  setViewMode: (mode: ViewMode) => void
  reset: () => void
}

export const useProjectsStore = create<ProjectsUIState>((set) => ({
  searchQuery: "",
  filter: "all",
  sort: "newest",
  viewMode: "grid",
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  setViewMode: (mode) => set({ viewMode: mode }),
  reset: () =>
    set({
      searchQuery: "",
      filter: "all",
      sort: "newest",
      viewMode: "grid",
    }),
}))
