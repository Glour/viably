import { create } from "zustand"
import type { ProjectsStoreState, ProjectFilter, ProjectSort, ViewMode } from "@/types"
import { getProjects, getProjectById, deleteProject as deleteProjectApi } from "@/lib/api/projects"

export const useProjectsStore = create<ProjectsStoreState>((set, get) => ({
  projects: [],
  currentProject: null,
  searchQuery: "",
  filter: "all" as ProjectFilter,
  sort: "newest" as ProjectSort,
  viewMode: "grid" as ViewMode,
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true })

    const res = await getProjects()

    set({
      projects: res.success ? res.projects : [],
      isLoading: false,
    })
  },

  loadProject: async (id: string) => {
    set({ isLoading: true })

    const res = await getProjectById(id)

    set({
      currentProject: res.success ? res.project : null,
      isLoading: false,
    })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setFilter: (filter: ProjectFilter) => {
    set({ filter })
  },

  setSort: (sort: ProjectSort) => {
    set({ sort })
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode })
  },

  deleteProject: async (id: string) => {
    const res = await deleteProjectApi(id)

    if (res.success) {
      const { projects, currentProject } = get()

      set({
        projects: projects.filter((p) => p.id !== id),
        currentProject: currentProject?.id === id ? null : currentProject,
      })
    }
  },

  getFilteredProjects: () => {
    const { projects, searchQuery, filter, sort } = get()
    const query = searchQuery.toLowerCase()

    const filtered = projects.filter((p) => {
      const matchesFilter =
        filter === "all" || p.status === filter

      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)

      return matchesFilter && matchesSearch
    })

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return sorted
  },
}))
