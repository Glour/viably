import { create } from "zustand"
import type { TransactionFilter } from "@/types"

interface SettingsUIState {
  transactionFilter: TransactionFilter
  setTransactionFilter: (filter: TransactionFilter) => void
  reset: () => void
}

const initialState = {
  transactionFilter: "all" as TransactionFilter,
}

export const useSettingsStore = create<SettingsUIState>((set) => ({
  ...initialState,
  setTransactionFilter: (filter) => set({ transactionFilter: filter }),
  /**
   * Resets the settings store to its initial state.
   * Clears transaction filter and any other UI preferences.
   */
  reset: () => set(initialState),
}))
