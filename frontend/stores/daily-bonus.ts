import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DailyBonusStoreState } from "@/types"

const getToday = () => new Date().toISOString().split("T")[0]
const getYesterday = () =>
  new Date(Date.now() - 86400000).toISOString().split("T")[0]

const calcReward = (streak: number) => (streak >= 6 ? 10 : 5)
const calcNextReward = (streak: number) => (streak + 1 >= 7 ? 10 : 5)

export const useDailyBonusStore = create<DailyBonusStoreState>()(
  persist(
    (set) => ({
      claimedToday: false,
      lastClaimedDate: null,
      streak: 0,
      todayReward: 5,
      nextReward: 5,

      checkStreak: () =>
        set((state) => {
          const today = getToday()
          const yesterday = getYesterday()

          if (state.lastClaimedDate === today) {
            return { claimedToday: true }
          }

          const streak =
            state.lastClaimedDate === yesterday ? state.streak : 0

          return {
            claimedToday: false,
            streak,
            todayReward: calcReward(streak),
            nextReward: calcNextReward(streak),
          }
        }),

      claim: () =>
        set((state) => {
          const newStreak = state.streak + 1
          return {
            claimedToday: true,
            lastClaimedDate: getToday(),
            streak: newStreak,
            todayReward: calcReward(newStreak),
            nextReward: calcNextReward(newStreak),
          }
        }),
    }),
    {
      name: "daily-bonus",
      partialize: (state) => ({
        claimedToday: state.claimedToday,
        lastClaimedDate: state.lastClaimedDate,
        streak: state.streak,
        todayReward: state.todayReward,
        nextReward: state.nextReward,
      }),
    },
  ),
)
