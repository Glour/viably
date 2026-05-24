"use client"

import Link from "next/link"
import { IconRenderer } from "@/shared/components/icon-renderer"
import { motion } from "motion/react"
import { TEMPLATES } from "@/shared/lib/data/templates"
import { fadeInUp, staggerContainer } from "@/shared/lib/animations"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { useHasMounted } from "@/shared/hooks/use-has-mounted"
import { useTranslations } from "next-intl"

export function TemplatesPreview() {
  const t = useTranslations('templates')
  const reduced = useReducedMotion()
  const mounted = useHasMounted()

  return (
    <section id="templates" className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background gradient orb */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[image:var(--gradient-warm)] opacity-5 blur-[120px] pointer-events-none" aria-hidden="true" />

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
          <p className="mt-4 font-body text-lg md:text-xl leading-relaxed text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Template cards grid */}
        <motion.div
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:mt-16 lg:grid-cols-4 lg:gap-6"
          variants={reduced ? undefined : staggerContainer}
          initial={!mounted || reduced ? undefined : "hidden"}
          whileInView={!mounted || reduced ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
        >
          {TEMPLATES.slice(0, 8).map((template) => (
            <motion.div
              key={template.slug}
              variants={reduced ? undefined : fadeInUp}
              whileHover={reduced ? undefined : {
                y: -4,
                transition: { duration: 0.3 }
              }}
              className="group relative rounded-xl border border-border/50 dark:border-border bg-card/40 dark:bg-card/80 p-5 backdrop-blur-xl shadow-md transition-shadow duration-300 hover:shadow-lg"
            >
              {/* Gradient border glow on hover */}
              <div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "var(--gradient-main)",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                  padding: "1px",
                }}
                aria-hidden="true"
              />

              {/* Popular badge */}
              {template.isPopular && (
                <span className="absolute right-3 top-3 rounded-full bg-[image:var(--gradient-main)] px-2.5 py-0.5 text-xs font-body font-semibold text-white shadow-[0_0_12px_var(--primary-glow)]">
                  {t('popular')}
                </span>
              )}

              {/* Emoji */}
              <span className="mb-3 block transition-transform duration-300 group-hover:scale-110" role="img" aria-hidden="true">
                <IconRenderer name={template.emoji} className="w-8 h-8" />
              </span>

              {/* Name */}
              <h3 className="font-heading text-lg font-semibold line-clamp-1 text-foreground">
                {template.name}
              </h3>

              {/* Credit cost badge */}
              <span className="mt-2 inline-block rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs font-body font-medium text-muted-foreground">
                {template.creditCost}{" "}
                {template.creditCost === 1
                  ? t('credit')
                  : t('credits')}
              </span>

              {/* Description (truncate to 2 lines) */}
              <p className="mt-2.5 line-clamp-2 font-body text-sm leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* View all link */}
        <motion.div
          className="mt-12 text-center"
          variants={reduced ? undefined : fadeInUp}
          initial={!mounted || reduced ? undefined : "hidden"}
          whileInView={!mounted || reduced ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
        >
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 dark:bg-card/80 px-6 py-3 font-body font-medium text-foreground backdrop-blur-xl transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_20px_var(--primary-glow)]"
          >
            {t('view_all')}
            <span className="text-lg">{"\u2192"}</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
