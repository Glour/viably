"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { TypeAnimation } from "react-type-animation"
import { GlowOrbs } from "@/components/ui/glow-orbs"
import { fadeInUp, staggerContainer } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const TYPING_SEQUENCE = [
  'describe("Greeting bot for my shop")',
  2000,
  "// Generating bot code...",
  1500,
  "export default class GreetingBot {",
  1500,
  "  handleMessage(msg) { ... }",
  1500,
  "Bot is live! \u2713",
  2000,
] as const

export function Hero() {
  const reduced = useReducedMotion()

  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden pt-28 pb-16 lg:pb-24"
    >
      {/* Background glow orbs */}
      <GlowOrbs className="absolute inset-0 -z-10" />

      {/* Content wrapper */}
      <motion.div
        className="mx-auto flex max-w-[1280px] flex-col items-center gap-12 px-6 lg:flex-row lg:items-center lg:gap-16"
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? undefined : "hidden"}
        whileInView={reduced ? undefined : "visible"}
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Left column: text content */}
        <div className="flex w-full flex-col items-center text-center lg:w-[60%] lg:items-start lg:text-left">
          {/* Badge */}
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary-subtle px-4 py-1.5 text-sm font-medium text-muted-foreground"
          >
            <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
              &#10022;
            </span>
            AI-Powered Bot Builder
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={reduced ? undefined : fadeInUp}
            className="font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-5xl lg:text-6xl"
          >
            <span className="block">&#1054;&#1087;&#1080;&#1096;&#1080; &#1080;&#1076;&#1077;&#1102;.</span>
            <span className="block">
              &#1055;&#1086;&#1083;&#1091;&#1095;&#1080; &#1075;&#1086;&#1090;&#1086;&#1074;&#1099;&#1081;{" "}
              <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
                &#1073;&#1086;&#1090;
              </span>
              .
            </span>
            <span className="block">&#1047;&#1072; 60 &#1089;&#1077;&#1082;&#1091;&#1085;&#1076;.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={reduced ? undefined : fadeInUp}
            className="mt-6 max-w-lg text-lg text-muted-foreground md:text-xl"
          >
            Viably &#1087;&#1088;&#1077;&#1074;&#1088;&#1072;&#1097;&#1072;&#1077;&#1090; &#1090;&#1074;&#1086;&#1080; &#1080;&#1076;&#1077;&#1080; &#1074; &#1088;&#1072;&#1073;&#1086;&#1090;&#1072;&#1102;&#1097;&#1080;&#1077; Telegram-&#1073;&#1086;&#1090;&#1099;.
            &#1041;&#1077;&#1079; &#1082;&#1086;&#1076;&#1072;. &#1041;&#1077;&#1079; &#1079;&#1085;&#1072;&#1085;&#1080;&#1081;.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold text-white bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_24px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_36px_var(--primary-glow)]"
            >
              &#9670; &#1053;&#1072;&#1095;&#1072;&#1090;&#1100; &#1073;&#1077;&#1089;&#1087;&#1083;&#1072;&#1090;&#1085;&#1086;
            </Link>
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-8 text-base font-semibold text-foreground transition-colors hover:bg-accent"
            >
              &#9655; &#1057;&#1084;&#1086;&#1090;&#1088;&#1077;&#1090;&#1100; &#1076;&#1077;&#1084;&#1086;
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.p
            variants={reduced ? undefined : fadeInUp}
            className="mt-6 text-sm text-muted-foreground"
          >
            &#1059;&#1078;&#1077; 1,200+ &#1073;&#1086;&#1090;&#1086;&#1074; &#1089;&#1086;&#1079;&#1076;&#1072;&#1085;&#1086; &#10003;
          </motion.p>
        </div>

        {/* Right column: demo card */}
        <motion.div
          variants={reduced ? undefined : fadeInUp}
          className="w-full max-w-md lg:w-[40%] lg:max-w-none"
        >
          <DemoCard reduced={reduced} />
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Demo Card  glass terminal mockup with typing animation            */
/* ------------------------------------------------------------------ */

function DemoCard({ reduced }: { reduced: boolean }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 shadow-2xl backdrop-blur-xl">
      {/* Title bar with traffic lights */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
        <span className="size-3 rounded-full bg-[#FF5F57]" />
        <span className="size-3 rounded-full bg-[#FEBC2E]" />
        <span className="size-3 rounded-full bg-[#28C840]" />
        <span className="ml-3 text-xs text-muted-foreground">
          viably &#8212; terminal
        </span>
      </div>

      {/* Code area */}
      <div className="min-h-[180px] px-5 py-4 font-code text-sm leading-relaxed sm:min-h-[200px]">
        <span className="select-none text-muted-foreground/60">$ </span>
        {reduced ? (
          <span className="text-green-400">Bot is live! &#10003;</span>
        ) : (
          <TypeAnimation
            sequence={[...TYPING_SEQUENCE]}
            wrapper="span"
            speed={40}
            repeat={Infinity}
            className="font-code text-sm text-green-400"
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 border-t border-border/30 px-4 py-2.5">
        <span className="size-2 rounded-full bg-green-500 animate-glow-pulse" />
        <span className="text-xs text-muted-foreground">Live</span>
        <span className="ml-auto text-xs text-muted-foreground/50">
          v1.0.0
        </span>
      </div>
    </div>
  )
}
