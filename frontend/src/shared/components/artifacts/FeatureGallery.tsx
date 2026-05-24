"use client"

import { memo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bot, Zap, Rocket, Database, Code2, Globe, Shield, Sparkles } from "lucide-react"

const SLIDES = [
  {
    icon: Sparkles,
    title: "AI генерирует за секунды",
    description: "Просто опишите задачу — AI напишет production-ready код с архитектурой, БД и логикой",
    gradient: "from-violet-600/20 via-purple-500/10 to-blue-600/20",
    accentColor: "text-violet-400",
    glowColor: "rgba(139,92,246,0.3)",
    mockup: "chat",
  },
  {
    icon: Rocket,
    title: "Deploy в один клик",
    description: "Нажмите Deploy — бот или сайт запустится на нашей инфраструктуре автоматически",
    gradient: "from-blue-600/20 via-cyan-500/10 to-emerald-600/20",
    accentColor: "text-blue-400",
    glowColor: "rgba(59,130,246,0.3)",
    mockup: "deploy",
  },
  {
    icon: Bot,
    title: "Telegram боты с FSM",
    description: "Полноценные боты с состояниями, базой данных, командами и inline-клавиатурами",
    gradient: "from-emerald-600/20 via-teal-500/10 to-cyan-600/20",
    accentColor: "text-emerald-400",
    glowColor: "rgba(16,185,129,0.3)",
    mockup: "bot",
  },
  {
    icon: Globe,
    title: "Лендинги и веб-приложения",
    description: "React + Vite + Tailwind + shadcn/ui — современный стек, готовый к продакшну",
    gradient: "from-orange-600/20 via-amber-500/10 to-yellow-600/20",
    accentColor: "text-orange-400",
    glowColor: "rgba(249,115,22,0.3)",
    mockup: "web",
  },
  {
    icon: Database,
    title: "База данных в комплекте",
    description: "PostgreSQL автоматически, ORM настроен, миграции и seed-данные из коробки",
    gradient: "from-pink-600/20 via-rose-500/10 to-red-600/20",
    accentColor: "text-pink-400",
    glowColor: "rgba(236,72,153,0.3)",
    mockup: "db",
  },
  {
    icon: Shield,
    title: "Безопасно и надёжно",
    description: "Изолированные контейнеры, автоматический restart, мониторинг 24/7",
    gradient: "from-indigo-600/20 via-violet-500/10 to-purple-600/20",
    accentColor: "text-indigo-400",
    glowColor: "rgba(99,102,241,0.3)",
    mockup: "shield",
  },
]

const ChatMockup = ({ accentColor }: { accentColor: string }) => (
  <div className="space-y-2 w-full max-w-[280px]">
    {[
      { from: "user", text: "Сделай бота записи для барбершопа" },
      { from: "ai", text: "Создаю бота с FSM и PostgreSQL..." },
      { from: "ai", text: "✅ Готово! 14 файлов, 3 таблицы в БД" },
    ].map((msg, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: msg.from === "user" ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.3 + 0.2 }}
        className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
      >
        <div className={`px-3 py-1.5 rounded-2xl text-xs max-w-[200px] ${
          msg.from === "user"
            ? "bg-violet-600/30 text-violet-100"
            : "bg-white/[0.08] text-foreground/80"
        }`}>
          {msg.from === "ai" && <span className={`${accentColor} mr-1`}>AI</span>}
          {msg.text}
        </div>
      </motion.div>
    ))}
  </div>
)

const DeployMockup = ({ accentColor }: { accentColor: string }) => (
  <div className="w-full max-w-[280px] space-y-2">
    {[
      { label: "Build", status: "✅", color: "text-emerald-400" },
      { label: "Docker", status: "✅", color: "text-emerald-400" },
      { label: "Deploy", status: "🚀", color: accentColor },
    ].map((step, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.25 + 0.2 }}
        className="flex items-center gap-3 bg-white/[0.05] rounded-xl px-3 py-2"
      >
        <span className="text-sm">{step.status}</span>
        <span className="text-xs text-foreground/70 flex-1">{step.label}</span>
        <motion.div
          className="h-1.5 bg-white/[0.08] rounded-full flex-1 max-w-[80px] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.25 + 0.4 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: i * 0.25 + 0.5, duration: 0.6 }}
          />
        </motion.div>
      </motion.div>
    ))}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2 }}
      className={`text-center text-sm font-semibold ${accentColor} py-1`}
    >
      https://mybot.viably.dev ✨
    </motion.div>
  </div>
)

const BotMockup = ({ accentColor }: { accentColor: string }) => (
  <div className="w-full max-w-[240px] bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.08]">
    <div className="bg-[#17212b] px-3 py-2 flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
        <Bot className="w-3 h-3 text-white" />
      </div>
      <span className="text-xs text-white/80 font-medium">BookingBot</span>
      <span className={`text-[10px] ${accentColor} ml-auto`}>●online</span>
    </div>
    <div className="p-3 space-y-2">
      {[
        { text: "Выберите услугу:", from: "bot" },
        { text: "✂️ Стрижка", from: "btn" },
        { text: "💈 Бритьё", from: "btn" },
      ].map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.2 + 0.3 }}
          className={m.from === "btn"
            ? "bg-white/[0.08] rounded-lg px-2 py-1 text-[10px] text-center text-foreground/70 cursor-pointer hover:bg-white/[0.12] transition-colors"
            : "text-[10px] text-foreground/60 bg-white/[0.04] rounded-lg px-2 py-1.5"
          }
        >
          {m.text}
        </motion.div>
      ))}
    </div>
  </div>
)

const WebMockup = ({ accentColor }: { accentColor: string }) => (
  <div className="w-full max-w-[280px] bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.08]">
    <div className="h-1.5 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />
    <div className="p-3 space-y-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-base font-bold ${accentColor}`}
      >
        Launchpad AI
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[10px] text-foreground/50 leading-relaxed"
      >
        Автоматизируй свой бизнес с помощью искусственного интеллекта
      </motion.div>
      <div className="flex gap-1.5 pt-1">
        {["Начать", "Подробнее"].map((btn, i) => (
          <motion.div
            key={btn}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium ${
              i === 0
                ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                : "bg-white/[0.08] text-foreground/60"
            }`}
          >
            {btn}
          </motion.div>
        ))}
      </div>
    </div>
  </div>
)

const DbMockup = ({ accentColor }: { accentColor: string }) => (
  <div className="w-full max-w-[280px] space-y-2">
    {[
      { table: "users", rows: 1247, color: "text-blue-400" },
      { table: "bookings", rows: 3891, color: "text-emerald-400" },
      { table: "services", rows: 12, color: "text-violet-400" },
    ].map((t, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.2 + 0.2 }}
        className="flex items-center gap-3 bg-white/[0.05] rounded-xl px-3 py-2"
      >
        <Database className={`w-3.5 h-3.5 ${t.color}`} />
        <span className="text-xs font-mono text-foreground/70 flex-1">{t.table}</span>
        <span className={`text-[10px] ${t.color}`}>{t.rows.toLocaleString()} rows</span>
      </motion.div>
    ))}
  </div>
)

const ShieldMockup = ({ accentColor }: { accentColor: string }) => (
  <div className="w-full max-w-[280px] space-y-2">
    {[
      { label: "Изолированный контейнер", ok: true },
      { label: "Auto-restart при сбое", ok: true },
      { label: "Мониторинг 24/7", ok: true },
      { label: "Ваши данные защищены", ok: true },
    ].map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.15 + 0.2 }}
        className="flex items-center gap-2.5 text-xs"
      >
        <span className="text-emerald-400 shrink-0">✓</span>
        <span className="text-foreground/60">{item.label}</span>
      </motion.div>
    ))}
  </div>
)

const MOCKUPS: Record<string, React.FC<{ accentColor: string }>> = {
  chat: ChatMockup,
  deploy: DeployMockup,
  bot: BotMockup,
  web: WebMockup,
  db: DbMockup,
  shield: ShieldMockup,
}

interface FeatureGalleryProps {
  className?: string
}

export const FeatureGallery = memo(function FeatureGallery({ className }: FeatureGalleryProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const slide = SLIDES[current]
  const Icon = slide.icon
  const Mockup = MOCKUPS[slide.mockup]

  return (
    <div className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-background/50 ${className ?? ""}`}>
      {/* Animated background glow */}
      <motion.div
        key={`glow-${current}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} pointer-events-none`}
      />

      {/* Floating orbs */}
      <div
        className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{ background: slide.glowColor }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-32 h-32 rounded-full blur-[60px] opacity-15 pointer-events-none"
        style={{ background: slide.glowColor }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 max-w-sm w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.06] border border-white/[0.08]`}>
              <Icon className={`w-6 h-6 ${slide.accentColor}`} />
            </div>

            {/* Mockup */}
            <div className="w-full flex justify-center">
              <Mockup accentColor={slide.accentColor} />
            </div>

            {/* Text */}
            <div className="text-center space-y-1.5">
              <h3 className={`text-base font-semibold ${slide.accentColor}`}>{slide.title}</h3>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">{slide.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? `w-5 h-1.5 ${slide.accentColor.replace("text-", "bg-")}`
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Viably badge */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
          <Sparkles className="w-3 h-3" />
          <span>Powered by Viably AI Platform</span>
        </div>
      </div>
    </div>
  )
})
