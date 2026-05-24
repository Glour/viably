import { useState, useEffect } from "react"
import { useComponentCleanup } from "@/shared/hooks/useComponentCleanup"

/**
 * Offline Detection Hook
 *
 * Task: T064, T037
 * Purpose: Detect when user goes offline/online using navigator.onLine API
 *
 * Features:
 * - Tracks online/offline status
 * - Listens to browser online/offline events
 * - Returns boolean: true if offline, false if online
 * - Proper cleanup with useComponentCleanup tracking
 *
 * @returns isOffline - true when offline, false when online
 */
export function useOfflineDetection(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof window !== "undefined" ? !navigator.onLine : false
  )
  const { registerSubscription } = useComponentCleanup("useOfflineDetection")

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    // Register both listeners with cleanup hook
    registerSubscription({
      type: "event",
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener("online", handleOnline),
      metadata: { event: "online", target: "window" },
    })

    registerSubscription({
      type: "event",
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener("offline", handleOffline),
      metadata: { event: "offline", target: "window" },
    })

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [registerSubscription])

  return isOffline
}
