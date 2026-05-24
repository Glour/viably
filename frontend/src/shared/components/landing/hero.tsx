"use client"

import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { fadeInUp, staggerContainer } from "@/shared/lib/animations"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { TypeAnimation } from "react-type-animation"
import { useAuthStore } from "@/features/auth/stores"
import { createProject } from "@/entities/project/api"

const TYPING_SEQUENCE = [
  'describe("Greeting bot for my shop")',
  2000,
  '// Generating bot code...',
  1500,
  'export default class GreetingBot {',
  1500,
  '  handleMessage(msg) { ... }',
  1500,
  'Bot is live! ✓',
  2000,
]

const SUGGESTION_KEYS = [
  "telegram_bot_faq",
  "startup_landing",
  "analytics_dashboard",
]

/** Detect project category from free-text prompt */
function detectCategory(text: string): "telegram_bot" | "website" | "webapp" {
  const lower = text.toLowerCase()
  const telegramKeywords = ["бот", "bot", "telegram", "телеграм", "tg", "aiogram", "pyrogram"]
  if (telegramKeywords.some((kw) => lower.includes(kw))) return "telegram_bot"

  const webappKeywords = ["dashboard", "дашборд", "admin", "panel", "панель", "analytics", "crm", "erp", "app", "application", "приложение", "кабинет", "portal"]
  if (webappKeywords.some((kw) => lower.includes(kw))) return "webapp"

  const websiteKeywords = ["landing", "landing page", "лендинг", "website", "site", "сайт", "portfolio", "портфолио", "store", "shop", "магазин", "ecommerce", "promo", "промо"]
  if (websiteKeywords.some((kw) => lower.includes(kw))) return "website"

  return "webapp"
}

export function Hero() {
  const t = useTranslations("hero")
  const tExamples = useTranslations("hero_examples")
  const reduced = useReducedMotion()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreate = useCallback(async (text?: string) => {
    const value = (text ?? prompt).trim()
    if (!value) return

    if (!isAuthenticated) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("viably_prompt", value)
      }
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const category = detectCategory(value)
      const project = await createProject({
        name: value.slice(0, 60),
        description: value,
        templateId: null,
        config: { initialPrompt: value, category },
        allowEmpty: true,
      })
      router.push(`/projects/${project.id}/ai`)
    } catch (e) {
      console.error("Failed to create project:", e)
      setLoading(false)
    }
  }, [prompt, isAuthenticated, router])

  return (
    <section
      id="hero"
      className="relative min-h-[80vh] overflow-hidden pt-32 pb-20 lg:pb-28 flex items-center"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute top-[-20%] left-[50%] -translate-x-1/2 h-[600px] w-[800px] rounded-full opacity-[0.15]"
          style={{
            background: "radial-gradient(ellipse, #6366f1 0%, #8b5cf6 30%, #06b6d4 60%, transparent 80%)",
            filter: "blur(120px)",
            animation: reduced ? "none" : "hero-blob-1 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full opacity-[0.10]"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, #6366f1 50%, transparent 80%)",
            filter: "blur(100px)",
            animation: reduced ? "none" : "hero-blob-2 10s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content — horizontal layout */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12 xl:gap-16">
          
          {/* Left column — text + prompt */}
          <motion.div
            className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
            variants={reduced ? undefined : staggerContainer}
            initial={reduced ? undefined : "hidden"}
            whileInView={reduced ? undefined : "visible"}
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Badge */}
            <motion.div
              variants={reduced ? undefined : fadeInUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary-subtle px-4 py-1.5 text-sm font-body font-medium text-muted-foreground"
            >
              <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent">✦</span>
              {t("badge")}
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={reduced ? undefined : fadeInUp}
              className="font-heading text-[1.75rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[3.5rem] xl:text-[4rem] font-bold leading-[1.08]"
              style={{ letterSpacing: "-0.03em" }}
            >
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                {t("title")}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={reduced ? undefined : fadeInUp}
              className="mt-6 max-w-xl font-body text-lg md:text-xl leading-relaxed text-muted-foreground"
            >
              {t("subtitle")}
            </motion.p>

            {/* Prompt Input */}
            <motion.div
              variants={reduced ? undefined : fadeInUp}
              className="mt-8 w-full max-w-2xl lg:max-w-xl"
            >
              <div className="relative flex items-center rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-lg shadow-indigo-500/5 transition-all duration-300 focus-within:border-indigo-500/50 focus-within:shadow-indigo-500/10">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleCreate()
                    }
                  }}
                  placeholder={t("placeholder")}
                  rows={2}
                  className="flex-1 resize-none bg-transparent px-3 sm:px-5 py-3 sm:py-4 text-sm sm:text-base font-body text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <div className="pr-3">
                  <button
                    onClick={() => handleCreate()}
                    disabled={loading || !prompt.trim()}
                    className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 sm:px-5 text-xs sm:text-sm whitespace-nowrap font-body font-bold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>{t("create")} <span aria-hidden="true">→</span></>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestion chips */}
              <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2">
                {SUGGESTION_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setPrompt(tExamples(key))
                      handleCreate(tExamples(key))
                    }}
                    disabled={loading}
                    className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs sm:text-sm font-body text-muted-foreground transition-all duration-200 hover:border-indigo-500/40 hover:text-foreground hover:bg-indigo-500/5 disabled:opacity-50"
                  >
                    {tExamples(key)}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Social proof */}
            <motion.p
              variants={reduced ? undefined : fadeInUp}
              className="mt-8 text-sm font-body text-muted-foreground flex items-center gap-2"
            >
              <span className="text-lg text-indigo-500">✓</span>
              <span className="font-semibold text-foreground">1,200+</span> {t("projects_count")}
            </motion.p>
          </motion.div>

          {/* Right column — terminal demo */}
          <motion.div
            className="flex-1 mt-10 lg:mt-0 w-full max-w-2xl lg:max-w-none mx-auto lg:mx-0"
            initial={reduced ? undefined : { opacity: 0, x: 40 }}
            whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 shadow-lg shadow-indigo-500/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">viably-terminal</span>
              </div>
              <div className="aspect-[4/3] lg:aspect-[3/2] rounded-lg bg-gradient-to-br from-indigo-500/5 to-violet-500/5 flex items-center justify-center p-4">
                <TypeAnimation
                  sequence={TYPING_SEQUENCE}
                  wrapper="div"
                  speed={50}
                  className="font-mono text-sm md:text-base text-muted-foreground"
                  repeat={Infinity}
                  cursor={true}
                />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
