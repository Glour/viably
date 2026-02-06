"use client"

import { Code2 } from "lucide-react"
import { motion } from "motion/react"
import { fadeInUp } from "@/lib/animations"
import { GlowOrbs } from "@/components/ui/glow-orbs"

export function IdleState() {
  return (
    <div className="relative h-full overflow-hidden flex items-center justify-center">
      <GlowOrbs />
      <motion.div
        className="flex flex-col items-center text-center z-10"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <Code2 className="size-16 opacity-20 mb-6" />
        <p className="text-lg font-medium text-foreground">
          Заполни параметры слева и нажми Generate
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          AI создаст полноценного бота по твоим требованиям
        </p>
      </motion.div>
    </div>
  )
}
