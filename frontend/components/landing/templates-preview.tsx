"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { TEMPLATES } from "@/lib/data/templates"
import { fadeInUp, staggerContainer } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const HOVER_GLOW = {
  y: -4,
  boxShadow: "0 20px 40px var(--primary-glow)",
}

export function TemplatesPreview() {
  const reduced = useReducedMotion()

  return (
    <section id="templates" className="py-20 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Section heading */}
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            {"Готовые шаблоны"}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[image:var(--gradient-main)]" />
          <p className="mt-4 text-muted-foreground">
            {"Выбери шаблон — получи бота за минуту"}
          </p>
        </div>

        {/* Template cards grid */}
        <motion.div
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8"
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
        >
          {TEMPLATES.map((template) => (
            <motion.div
              key={template.slug}
              variants={reduced ? undefined : fadeInUp}
              whileHover={reduced ? undefined : HOVER_GLOW}
              transition={{ duration: 0.2 }}
              className="relative rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-sm"
            >
              {/* Popular badge */}
              {template.isPopular && (
                <span className="absolute right-4 top-4 rounded-full bg-[image:var(--gradient-main)] px-3 py-0.5 text-xs font-medium text-white">
                  {"Популярный"}
                </span>
              )}

              {/* Emoji */}
              <span className="mb-4 block text-4xl" role="img" aria-hidden="true">
                {template.emoji}
              </span>

              {/* Name */}
              <h3 className="font-heading text-lg font-semibold">
                {template.name}
              </h3>

              {/* Credit cost badge */}
              <span className="mt-2 inline-block rounded-full border border-border/60 bg-muted/50 px-3 py-0.5 text-xs font-medium text-muted-foreground">
                {template.creditCost}{" "}
                {template.creditCost === 1
                  ? "кредит"
                  : template.creditCost < 5
                    ? "кредита"
                    : "кредитов"}
              </span>

              {/* Description (truncate to 2 lines) */}
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* View all link */}
        <div className="mt-12 text-center">
          <Link
            href="/templates"
            className="bg-[image:var(--gradient-main)] bg-clip-text font-medium text-transparent hover:underline"
          >
            {"Смотреть все шаблоны \u2192"}
          </Link>
        </div>
      </div>
    </section>
  )
}
