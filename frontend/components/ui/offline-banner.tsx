"use client"

import * as React from "react"
import { AlertTriangle, Wifi } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

interface OfflineBannerProps {
  isOffline: boolean
}

/**
 * Offline Banner Component
 *
 * Task: T065
 * Purpose: Show banner when user goes offline, hide when online
 *
 * Features:
 * - Animated slide-down on offline
 * - Animated slide-up on online
 * - Warning colors (yellow/amber)
 * - WiFi icon
 *
 * @param isOffline - true to show banner, false to hide
 */
export function OfflineBanner({ isOffline }: OfflineBannerProps) {
  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg"
        >
          <div className="container mx-auto flex items-center justify-center gap-3">
            <AlertTriangle className="size-5" />
            <p className="text-sm font-medium">
              Нет подключения к интернету. Некоторые функции могут быть недоступны.
            </p>
            <Wifi className="size-5" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
