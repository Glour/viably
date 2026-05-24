"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/shared/lib/utils"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"

export function FadeInUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) {
      setIsVisible(true)
      return
    }

    // Use IntersectionObserver with fallback
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0, rootMargin: '50px' }
    )

    observer.observe(el)

    // Fallback: if not visible after 1 second, force show
    const timeout = setTimeout(() => setIsVisible(true), 1000)

    return () => {
      observer.disconnect()
      clearTimeout(timeout)
    }
  }, [])

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
