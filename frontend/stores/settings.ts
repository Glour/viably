import { create } from "zustand"
import type { TransactionFilter } from "@/types"

interface SettingsUIState {
  transactionFilter: TransactionFilter
  setTransactionFilter: (filter: TransactionFilter) => void
}

export const useSettingsStore = create<SettingsUIState>((set) => ({
  transactionFilter: "all",
  setTransactionFilter: (filter) => set({ transactionFilter: filter }),
}))
