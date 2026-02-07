import { useState, useEffect } from "react"

/**
 * Offline Detection Hook
 *
 * Task: T064
 * Purpose: Detect when user goes offline/online using navigator.onLine API
 *
 * Features:
 * - Tracks online/offline status
 * - Listens to browser online/offline events
 * - Returns boolean: true if offline, false if online
 *
 * @returns isOffline - true when offline, false when online
 */
export function useOfflineDetection(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof window !== "undefined" ? !navigator.onLine : false
  )

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOffline
}
