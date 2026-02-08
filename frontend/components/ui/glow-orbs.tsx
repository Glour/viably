"use client"

import { useEffect } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useMediaQuery } from "@/hooks/use-media-query"

const orbs = [
  { color: "#7C3AED", size: 400, x: "20%", y: "30%" },
  { color: "#2563EB", size: 300, x: "60%", y: "20%" },
  { color: "#06B6D4", size: 250, x: "40%", y: "60%" },
]

export function GlowOrbs({ className, count = 3 }: { className?: string; count?: number }) {
  const reduced = useReducedMotion()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 })

  useEffect(() => {
    if (reduced) return
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2)
      mouseY.set(e.clientY - window.innerHeight / 2)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [reduced, mouseX, mouseY])

  if (!isDesktop) return null

  const visibleOrbs = orbs.slice(0, count)

  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)} aria-hidden="true">
      {visibleOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-[0.08] dark:opacity-[0.15]"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            filter: "blur(80px)",
            left: orb.x,
            top: orb.y,
            x: reduced ? 0 : springX,
            y: reduced ? 0 : springY,
          }}
          animate={reduced ? undefined : {
            translateY: [0, -10, 0, 10, 0],
          }}
          transition={reduced ? undefined : {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
    </div>
  )
}
