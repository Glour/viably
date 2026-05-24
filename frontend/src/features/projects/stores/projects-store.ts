/**
 * Projects Feature Store
 *
 * UI-only store for the projects list page.
 *
 * Data fetching and mutations are handled by React Query hooks
 * from @/entities/project (useProjects, useDeleteProject, etc.).
 * This store only tracks ephemeral client-side UI state (search, filters,
 * sort order, view mode).
 */

import { create } from "zustand"
import type { ProjectFilter, ProjectSort, ViewMode } from "../types"

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

const initialState = {
  searchQuery: "",
  filter: "all" as ProjectFilter,
  sort: "newest" as ProjectSort,
  viewMode: "grid" as ViewMode,
}

export const useProjectsStore = create<ProjectsUIState>((set) => ({
  ...initialState,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  setViewMode: (mode) => set({ viewMode: mode }),
  reset: () => set(initialState),
}))
