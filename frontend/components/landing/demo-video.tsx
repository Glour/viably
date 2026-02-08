"use client"

import { motion } from "motion/react"
import { LiteYouTube } from "@/components/video/lite-youtube"
import { fadeInUp, staggerContainer } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

export function DemoVideo() {
  const reduced = useReducedMotion()
  const videoId = process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID

  if (!videoId) {
    return null
  }

  return (
    <section id="demo" className="py-20 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
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
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              Смотри, как это работает
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              2-минутное демо покажет весь процесс создания бота — от идеи до
              готового продукта
            </p>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[image:var(--gradient-main)]" />
          </motion.div>

          {/* Video player */}
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            className="mx-auto max-w-4xl"
          >
            <LiteYouTube
              videoId={videoId}
              title="Viably Demo — Создание Telegram-бота за 60 секунд"
            />
          </motion.div>

          {/* Optional CTA below video */}
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground">
              Готов создать своего первого бота?
            </p>
            <a
              href="/register"
              className="mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold text-white bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_24px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_36px_var(--primary-glow)]"
            >
              Начать бесплатно
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
