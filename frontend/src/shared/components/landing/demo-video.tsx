"use client"

import { motion } from "motion/react"
import { LiteYouTube } from "@/shared/components/video/lite-youtube"
import { fadeInUp, staggerContainer } from "@/shared/lib/animations"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { useTranslations } from "next-intl"

export function DemoVideo() {
  const t = useTranslations('demo_video')
  const reduced = useReducedMotion()
  const videoId = process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID

  if (!videoId) {
    return null
  }

  return (
    <section id="demo" className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[image:var(--gradient-main)] opacity-5 blur-[140px] pointer-events-none" aria-hidden="true" />

      <div className="mx-auto max-w-[1280px] px-6 relative">
        <motion.div
          className="space-y-12"
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? undefined : "hidden"}
          whileInView={reduced ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Section heading */}
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            className="text-center"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">
              {t('title')}{" "}
              <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
                {t('title_highlight')}
              </span>
            </h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[image:var(--gradient-main)]" />
            <p className="mx-auto mt-4 max-w-2xl font-body text-lg md:text-xl leading-relaxed text-muted-foreground">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Video player with glow frame */}
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            className="mx-auto max-w-4xl"
          >
            <div className="group relative rounded-2xl border border-border/50 bg-card/40 p-2 backdrop-blur-xl shadow-xl transition-all duration-500 hover:shadow-[0_0_40px_var(--primary-glow)]">
              {/* Gradient border glow */}
              <div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-50 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: "var(--gradient-main)",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                  padding: "2px",
                }}
                aria-hidden="true"
              />

              {/* Video container */}
              <div className="relative rounded-xl overflow-hidden">
                <LiteYouTube
                  videoId={videoId}
                  title={t('video_title')}
                />
              </div>
            </div>
          </motion.div>

          {/* Optional CTA below video */}
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            className="text-center"
          >
            <p className="font-body text-base leading-relaxed text-muted-foreground">
              {t('cta_text')}
            </p>
            <a
              href="/register"
              className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-base font-body font-semibold text-white bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_24px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_40px_var(--primary-glow)] hover:scale-105"
            >
              {t('cta_button')}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
