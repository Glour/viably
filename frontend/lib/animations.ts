import type { Variants } from "motion/react"

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

export const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
}

export const shimmerGradient = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" as const },
  },
}

export const typewriter: Variants = {
  hidden: { opacity: 0, width: 0 },
  visible: {
    opacity: 1,
    width: "auto",
    transition: { duration: 0.05 },
  },
}

export const pulseGlow: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
}

export const staggerFadeIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
}

export const progressBar: Variants = {
  hidden: { width: "0%" },
  visible: {
    width: "var(--progress)",
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export const slideUpSheet: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
