import { create } from "zustand"
import type { SettingsStoreState, TransactionFilter } from "@/types"
import {
  getProfile,
  updateProfile,
  changePassword,
  getUserPlan,
} from "@/lib/api/settings"
import { AVAILABLE_PLANS } from "@/lib/data/settings"

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  // Profile
  profile: null,
  isLoadingProfile: false,
  isSavingProfile: false,

  // Billing UI state
  transactionFilter: "all" as TransactionFilter,
  setTransactionFilter: (filter) => set({ transactionFilter: filter }),

  // Plan
  currentPlan: null,
  availablePlans: AVAILABLE_PLANS,
  isLoadingPlan: false,

  // Profile actions
  loadProfile: async () => {
    set({ isLoadingProfile: true })
    try {
      const user = await getProfile()
      set({ profile: user, isLoadingProfile: false })
    } catch {
      set({ profile: null, isLoadingProfile: false })
    }
  },

  updateProfile: async (data) => {
    set({ isSavingProfile: true })
    try {
      const user = await updateProfile(data)
      set({ profile: user, isSavingProfile: false })
      return true
    } catch {
      set({ isSavingProfile: false })
      return false
    }
  },

  changePassword: async (data) => {
    const res = await changePassword(data)
    return res.success
  },

  // Plan actions
  loadPlan: async () => {
    set({ isLoadingPlan: true })
    try {
      const res = await getUserPlan()
      set({
        currentPlan: res.planInfo,
        availablePlans: res.availablePlans,
        isLoadingPlan: false,
      })
    } catch {
      set({ isLoadingPlan: false })
    }
  },
}))
