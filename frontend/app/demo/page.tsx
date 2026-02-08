"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Play,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Video chapters for navigation
const chapters = [
  { time: "0:00", title: "Введение", description: "Знакомство с Viably" },
  {
    time: "0:10",
    title: "Регистрация",
    description: "Получи 5 бесплатных кредитов",
  },
  {
    time: "0:20",
    title: "Выбор шаблона",
    description: "6 готовых шаблонов ботов",
  },
  {
    time: "0:35",
    title: "Настройка параметров",
    description: "Простая форма конфигурации",
  },
  {
    time: "0:50",
    title: "AI генерация",
    description: "Создание полного проекта",
  },
  {
    time: "1:05",
    title: "Деплой в один клик",
    description: "Автоматическое развертывание",
  },
  {
    time: "1:25",
    title: "Демо бота в Telegram",
    description: "Работающий бот за минуты",
  },
  {
    time: "1:45",
    title: "Призыв к действию",
    description: "Начни создавать своего бота",
  },
]

// Key features demonstrated in video
const keyFeatures = [
  {
    icon: Clock,
    title: "60 секунд",
    description: "От идеи до работающего бота",
  },
  {
    icon: CheckCircle2,
    title: "Без программирования",
    description: "AI генерирует весь код за тебя",
  },
  {
    icon: TrendingUp,
    title: "Production-ready",
    description: "Готовый код с best practices",
  },
  {
    icon: Users,
    title: "6 шаблонов",
    description: "Для любого бизнес-кейса",
  },
]

// Video stats
const videoStats = [
  { label: "Продолжительность", value: "2:00" },
  { label: "Разрешение", value: "1080p" },
  { label: "Язык", value: "Русский" },
  { label: "Субтитры", value: "RU, EN" },
]

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false)

  // Replace with actual YouTube video ID when available
  const youtubeVideoId = "dQw4w9WgXcQ" // Placeholder
  const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <FadeInUp delay={0}>
          <div className="text-center space-y-4">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold">
              Viably в действии
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Смотри, как создать Telegram-бота с AI за 2 минуты — от
              регистрации до продакшена
            </p>
          </div>
        </FadeInUp>

        {/* Video Player */}
        <FadeInUp delay={0.1}>
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
              {!isPlaying ? (
                // Video thumbnail with play button
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20 cursor-pointer group"
                  onClick={() => setIsPlaying(true)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <Button
                      size="lg"
                      className="h-20 w-20 rounded-full relative z-10 group-hover:scale-110 transition-transform"
                    >
                      <Play className="h-8 w-8 ml-1" fill="currentColor" />
                    </Button>
                  </div>
                  <div className="absolute bottom-8 left-8 text-white">
                    <p className="text-sm opacity-80">Демо-видео</p>
                    <p className="text-2xl font-bold">
                      Создай бота за 60 секунд
                    </p>
                  </div>
                </motion.div>
              ) : (
                // YouTube iframe (lazy loaded)
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
                  title="Viably Demo - Создай Telegram-бота за 60 секунд с AI"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                  loading="lazy"
                />
              )}
            </div>

            {/* Video metadata */}
            <div className="p-6 border-t">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Полный туториал: От идеи до продакшена
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Узнай, как создать, настроить и задеплоить Telegram-бота
                    без знания программирования
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Смотреть на YouTube
                    </a>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">
                      Попробовать бесплатно
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </FadeInUp>

        {/* Video stats */}
        <FadeInUp delay={0.15}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {videoStats.map((stat) => (
              <Card key={stat.label} className="p-4 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </Card>
            ))}
          </div>
        </FadeInUp>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Key features */}
          <FadeInUp delay={0.2}>
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold">
                Что ты увидишь
              </h2>
              <div className="space-y-3">
                {keyFeatures.map((feature, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </FadeInUp>

          {/* Video chapters */}
          <FadeInUp delay={0.25}>
            <div className="space-y-4">
              <h2 className="font-heading text-2xl font-bold">
                Временные метки
              </h2>
              <Card className="p-4">
                <div className="space-y-3">
                  {chapters.map((chapter, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsPlaying(true)
                        // In production, this would seek to the chapter time
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-mono text-primary font-medium min-w-[3rem]">
                          {chapter.time}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium group-hover:text-primary transition-colors">
                            {chapter.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {chapter.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </FadeInUp>
        </div>

        {/* Call to action */}
        <FadeInUp delay={0.3}>
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
            <h2 className="font-heading text-3xl font-bold mb-3">
              Готов создать своего первого бота?
            </h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
              Регистрируйся, получай 5 бесплатных кредитов и создавай ботов с
              AI прямо сейчас
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Начать бесплатно
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/docs/quickstart">Читать Quick Start</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Не требуется кредитная карта • Деплой за 1 клик
            </p>
          </Card>
        </FadeInUp>

        {/* Additional resources */}
        <FadeInUp delay={0.35}>
          <div className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-center">
              Дополнительные ресурсы
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-2">Quick Start Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Пошаговая инструкция для создания первого бота
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/docs/quickstart">
                    Читать гайд
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-2">Шаблоны ботов</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Изучи 6 готовых шаблонов для разных кейсов
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/docs/templates">
                    Все шаблоны
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-2">FAQ</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ответы на часто задаваемые вопросы
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/docs/faq">
                    Читать FAQ
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </FadeInUp>
      </div>
    </MainLayout>
  )
}
