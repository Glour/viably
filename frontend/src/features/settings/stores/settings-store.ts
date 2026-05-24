import { create } from 'zustand'

interface SettingsState {
  transactionFilter: string | null
  setTransactionFilter: (filter: string | null) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  transactionFilter: null,
  setTransactionFilter: (filter) => set({ transactionFilter: filter }),
  reset: () => set({ transactionFilter: null }),
}))
