import { useState, useEffect, useRef } from "react"

/**
 * RequestAnimationFrame Progress Hook
 *
 * Task: T070
 * Purpose: Smoothly animate progress value using requestAnimationFrame for 60fps
 *
 * Features:
 * - Interpolates between current and target progress value
 * - Uses requestAnimationFrame for smooth 60fps animation
 * - Cancels animation on unmount or value change
 *
 * @param targetProgress - Target progress value (0-100)
 * @param duration - Animation duration in milliseconds (default: 300)
 * @returns Smoothly animated progress value
 */
export function useRafProgress(targetProgress: number, duration: number = 300): number {
  const [currentProgress, setCurrentProgress] = useState(targetProgress)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(targetProgress)

  useEffect(() => {
    // Cancel any ongoing animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    // If target hasn't changed, no animation needed
    if (Math.abs(targetProgress - currentProgress) < 0.01) {
      return
    }

    // Store start value and time
    startValueRef.current = currentProgress
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (easeOutQuad)
      const easedProgress = 1 - (1 - progress) * (1 - progress)

      // Interpolate between start and target
      const newValue = startValueRef.current + (targetProgress - startValueRef.current) * easedProgress

      setCurrentProgress(newValue)

      // Continue animation if not complete
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    // Cleanup on unmount or dependency change
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [targetProgress, duration, currentProgress])

  return currentProgress
}
