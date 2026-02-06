import { create } from "zustand"
import type { SettingsStoreState, TransactionFilter } from "@/types"
import {
  getProfile,
  updateProfile,
  changePassword,
  getTransactions,
  getUserPlan,
} from "@/lib/api/settings"
import { AVAILABLE_PLANS } from "@/lib/data/settings"

const TRANSACTIONS_PER_PAGE = 10

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  // Profile
  profile: null,
  isLoadingProfile: false,
  isSavingProfile: false,

  // Billing
  transactions: [],
  transactionFilter: "all" as TransactionFilter,
  isLoadingTransactions: false,
  hasMoreTransactions: true,

  // Plan
  currentPlan: null,
  availablePlans: AVAILABLE_PLANS,
  isLoadingPlan: false,

  // Profile actions
  loadProfile: async () => {
    set({ isLoadingProfile: true })
    const res = await getProfile()
    set({
      profile: res.success ? res.user : null,
      isLoadingProfile: false,
    })
  },

  updateProfile: async (data) => {
    set({ isSavingProfile: true })
    const res = await updateProfile(data)
    if (res.success) {
      set({ profile: res.user, isSavingProfile: false })
      return true
    }
    set({ isSavingProfile: false })
    return false
  },

  changePassword: async (data) => {
    const res = await changePassword(data)
    return res.success
  },

  // Billing actions
  loadTransactions: async () => {
    const { transactionFilter } = get()
    set({ isLoadingTransactions: true, transactions: [] })
    const res = await getTransactions({
      filter: transactionFilter,
      offset: 0,
      limit: TRANSACTIONS_PER_PAGE,
    })
    if (res.success) {
      set({
        transactions: res.transactions,
        hasMoreTransactions: res.hasMore,
        isLoadingTransactions: false,
      })
    } else {
      set({ isLoadingTransactions: false })
    }
  },

  loadMoreTransactions: async () => {
    const { transactions, transactionFilter } = get()
    set({ isLoadingTransactions: true })
    const res = await getTransactions({
      filter: transactionFilter,
      offset: transactions.length,
      limit: TRANSACTIONS_PER_PAGE,
    })
    if (res.success) {
      set({
        transactions: [...transactions, ...res.transactions],
        hasMoreTransactions: res.hasMore,
        isLoadingTransactions: false,
      })
    } else {
      set({ isLoadingTransactions: false })
    }
  },

  setTransactionFilter: (filter) => {
    set({ transactionFilter: filter })
    get().loadTransactions()
  },

  // Plan actions
  loadPlan: async () => {
    set({ isLoadingPlan: true })
    const res = await getUserPlan()
    if (res.success) {
      set({
        currentPlan: res.planInfo,
        availablePlans: res.availablePlans,
        isLoadingPlan: false,
      })
    } else {
      set({ isLoadingPlan: false })
    }
  },

  // Computed
  getFilteredTransactions: () => {
    const { transactions, transactionFilter } = get()
    if (transactionFilter === "all") return transactions
    return transactions.filter((t) => t.type === transactionFilter)
  },
}))
