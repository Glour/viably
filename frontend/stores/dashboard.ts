import { create } from "zustand"
import type { DashboardStoreState } from "@/types"
import { getUserProfile, getRecentProjects } from "@/lib/api/dashboard"

export const useDashboardStore = create<DashboardStoreState>((set) => ({
  user: null,
  projects: [],
  isLoading: false,
  loadDashboard: async () => {
    set({ isLoading: true })

    const [profileRes, projectsRes] = await Promise.all([
      getUserProfile(),
      getRecentProjects(),
    ])

    set({
      user: profileRes.success ? profileRes.user : null,
      projects: projectsRes.success ? projectsRes.projects : [],
      isLoading: false,
    })
  },
}))
