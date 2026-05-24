"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"

export function useCountUp(end: number, duration: number = 1000): number {
  const prefersReducedMotion = useReducedMotion()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (end === 0 || prefersReducedMotion) return

    const start = performance.now()
    let frameId: number

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      setCurrent(Math.round(eased * end))
      if (t < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [end, duration, prefersReducedMotion])

  if (end === 0 || prefersReducedMotion) return end

  return current
}
