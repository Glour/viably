"use client"

import { Code2 } from "lucide-react"
import { motion } from "motion/react"
import { fadeInUp } from "@/shared/lib/animations"
import { GlowOrbs } from "@/shared/ui/glow-orbs"

export function IdleState() {
  return (
    <div className="relative h-full overflow-hidden flex items-center justify-center">
      <GlowOrbs />
      <motion.div
        className="flex flex-col items-center text-center z-10 px-4"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <Code2 className="size-16 opacity-20 mb-6" />
        <p className="font-heading text-xl md:text-2xl font-bold text-foreground">
          Заполни параметры слева и нажми «Генерировать»
        </p>
        <p className="font-body text-sm md:text-base text-muted-foreground mt-2">
          AI создаст полноценного бота по твоим требованиям
        </p>
      </motion.div>
    </div>
  )
}
