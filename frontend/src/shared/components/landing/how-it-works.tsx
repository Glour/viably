"use client"

import { motion } from "motion/react"
import { PenLine, Zap, Rocket } from "lucide-react"
import { fadeInUp, staggerContainer } from "@/shared/lib/animations"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { useHasMounted } from "@/shared/hooks/use-has-mounted"
import { useTranslations } from "next-intl"

interface Step {
  number: number
  Icon: React.ComponentType<{ className?: string }>
  titleKey: string
  descKey: string
}

const STEP_ICONS: Step[] = [
  { number: 1, Icon: PenLine, titleKey: "step1_title", descKey: "step1_desc" },
  { number: 2, Icon: Zap, titleKey: "step2_title", descKey: "step2_desc" },
  { number: 3, Icon: Rocket, titleKey: "step3_title", descKey: "step3_desc" },
]

export function HowItWorks() {
  const t = useTranslations('how_it_works')
  const reduced = useReducedMotion()
  const mounted = useHasMounted()

  return (
    <section id="features" className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[image:var(--gradient-main)] opacity-5 blur-[100px] pointer-events-none" aria-hidden="true" />

      <div className="mx-auto max-w-[1280px] px-6 relative">
        {/* Section heading */}
        <motion.div
          className="text-center"
          variants={reduced ? undefined : fadeInUp}
          initial={!mounted || reduced ? undefined : "hidden"}
          whileInView={!mounted || reduced ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {t('title')}{" "}
            <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
              {t('title_highlight')}
            </span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[image:var(--gradient-main)]" />
        </motion.div>

        {/* Step cards grid */}
        <motion.div
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-16 lg:gap-8"
          variants={reduced ? undefined : staggerContainer}
          initial={!mounted || reduced ? undefined : "hidden"}
          whileInView={!mounted || reduced ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
        >
          {STEP_ICONS.map((step) => (
            <motion.div
              key={step.number}
              variants={reduced ? undefined : fadeInUp}
              whileHover={reduced ? undefined : {
                y: -4,
                transition: { duration: 0.3 }
              }}
              className="group relative rounded-2xl border border-border/50 dark:border-border bg-card/40 dark:bg-card/80 p-6 backdrop-blur-xl shadow-lg transition-shadow duration-300 hover:shadow-xl lg:p-8"
            >
              {/* Number badge */}
              <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary font-heading text-xl font-bold text-white">
                {step.number}
              </div>

              {/* Icon */}
              <div className="mb-3 transition-transform duration-300 group-hover:scale-110">
                <step.Icon className="w-6 h-6 text-violet-400" />
              </div>

              {/* Title */}
              <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground">{t(step.titleKey)}</h3>

              {/* Description */}
              <p className="mt-3 font-body text-base leading-relaxed text-muted-foreground">
                {t(step.descKey)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
