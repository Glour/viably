"use client"

import { motion } from "motion/react"
import { fadeInUp, staggerContainer } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface Step {
  number: number
  icon: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: "\u270E",
    title: "\u041E\u043F\u0438\u0448\u0438 \u0438\u0434\u0435\u044E",
    description:
      "\u0412\u044B\u0431\u0435\u0440\u0438 \u0448\u0430\u0431\u043B\u043E\u043D \u0438 \u0437\u0430\u043F\u043E\u043B\u043D\u0438 \u043F\u0430\u0440\u0443 \u043F\u043E\u043B\u0435\u0439",
  },
  {
    number: 2,
    icon: "\u26A1",
    title: "AI \u0433\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0435\u0442 \u043A\u043E\u0434",
    description:
      "\u0421\u043C\u043E\u0442\u0440\u0438 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043A\u0430\u043A \u043A\u043E\u0434 \u043F\u0438\u0448\u0435\u0442\u0441\u044F",
  },
  {
    number: 3,
    icon: "\uD83D\uDE80",
    title:
      "\u0414\u0435\u043F\u043B\u043E\u0439 \u043E\u0434\u043D\u0438\u043C \u043A\u043B\u0438\u043A\u043E\u043C",
    description:
      "\u0411\u043E\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0447\u0435\u0440\u0435\u0437 60 \u0441\u0435\u043A\u0443\u043D\u0434",
  },
]

const HOVER_GLOW = {
  y: -4,
  boxShadow: "0 20px 40px var(--primary-glow)",
}

export function HowItWorks() {
  const reduced = useReducedMotion()

  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Section heading */}
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            {"\u041A\u0430\u043A \u044D\u0442\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442"}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[image:var(--gradient-main)]" />
        </div>

        {/* Step cards grid */}
        <motion.div
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-16 lg:gap-8"
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={reduced ? undefined : fadeInUp}
              whileHover={reduced ? undefined : HOVER_GLOW}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm lg:p-8"
            >
              {/* Number badge */}
              <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-[image:var(--gradient-main)] font-heading text-lg font-bold text-white">
                {step.number}
              </div>

              {/* Icon */}
              <span className="mb-3 block text-2xl" role="img" aria-hidden="true">
                {step.icon}
              </span>

              {/* Title */}
              <h3 className="font-heading text-lg font-semibold">{step.title}</h3>

              {/* Description */}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
