import { AppHeader } from "@/widgets/layout"
import { Footer } from "@/shared/components/landing/footer"

export const metadata = {
  title: "О проекте — Viably",
  description: "Viably — платформа для создания приложений, ботов и сайтов с помощью AI",
}

export default function AboutPage() {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-heading font-bold mb-8">О проекте</h1>

          <div className="prose prose-lg dark:prose-invert font-body">
            <p className="text-xl text-muted-foreground leading-relaxed">
              <strong>Viably</strong> — платформа для создания приложений, ботов и сайтов
              с помощью AI. Опишите идею — получите готовый продукт.
            </p>

            <h2>Наша миссия</h2>
            <p>
              Мы верим, что создание цифровых продуктов должно быть доступно каждому.
              Viably убирает барьер между идеей и реализацией: вам не нужно быть
              программистом, чтобы запустить бота, сайт или приложение.
            </p>

            <h2>Что мы делаем</h2>
            <ul>
              <li>Генерация кода по описанию на естественном языке</li>
              <li>Готовые шаблоны для быстрого старта</li>
              <li>Деплой в один клик</li>
              <li>Поддержка Telegram-ботов, веб-приложений и API</li>
            </ul>

            <h2>Команда</h2>
            <p>
              Viably создаётся в России командой разработчиков, увлечённых AI и
              продуктовой разработкой. Мы строим инструменты, которыми пользуемся сами.
            </p>

            <div className="mt-8 p-6 rounded-lg border border-border bg-card/50">
              <p className="text-sm text-muted-foreground m-0">
                Есть вопросы или предложения? Напишите нам —{" "}
                <a href="mailto:hello@viably.app" className="text-primary hover:underline">
                  hello@viably.app
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
