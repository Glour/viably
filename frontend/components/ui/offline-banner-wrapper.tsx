"use client"

import { useOfflineDetection } from "@/lib/hooks/use-offline-detection"
import { OfflineBanner } from "./offline-banner"

/**
 * Offline Banner Wrapper (Client Component)
 *
 * Task: T066
 * Purpose: Client-side wrapper for OfflineBanner to use in server layout
 *
 * Features:
 * - Uses useOfflineDetection hook
 * - Passes isOffline to OfflineBanner
 */
export function OfflineBannerWrapper() {
  const isOffline = useOfflineDetection()

  return <OfflineBanner isOffline={isOffline} />
}
