"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GlowOrbs } from "@/components/ui/glow-orbs"
import { Shimmer } from "@/components/ui/shimmer"
import { FadeInUp } from "@/components/motion/fade-in-up"

export default function ComponentsPage() {
  // Color tokens for swatch display
  const colorTokens = [
    { name: "primary", var: "var(--primary)", label: "Primary" },
    { name: "primary-hover", var: "var(--primary-hover)", label: "Primary Hover" },
    { name: "primary-light", var: "var(--primary-light)", label: "Primary Light" },
    { name: "secondary", var: "var(--secondary)", label: "Secondary" },
    { name: "accent", var: "var(--accent)", label: "Accent" },
    { name: "destructive", var: "var(--destructive)", label: "Destructive" },
    { name: "muted", var: "var(--muted)", label: "Muted" },
    { name: "background", var: "var(--background)", label: "Background" },
    { name: "foreground", var: "var(--foreground)", label: "Foreground" },
    { name: "card", var: "var(--card)", label: "Card" },
    { name: "border", var: "var(--border)", label: "Border" },
    { name: "success", var: "var(--success)", label: "Success" },
    { name: "warning", var: "var(--warning)", label: "Warning" },
    { name: "info", var: "var(--info)", label: "Info" },
  ]

  const gradients = [
    { name: "gradient-main", var: "var(--gradient-main)", label: "Main Gradient" },
    { name: "gradient-warm", var: "var(--gradient-warm)", label: "Warm Gradient" },
    { name: "gradient-cool", var: "var(--gradient-cool)", label: "Cool Gradient" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with theme toggle */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="font-heading text-2xl font-bold">Дизайн-система</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        {/* Color Tokens Section */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Цвета</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {colorTokens.map((token) => (
              <div key={token.name} className="space-y-2">
                <div
                  className="h-16 rounded-xl border"
                  style={{ backgroundColor: token.var }}
                />
                <p className="text-sm font-medium">{token.label}</p>
                <p className="text-xs text-muted-foreground">--{token.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gradients Section */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Градиенты</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {gradients.map((g) => (
              <div key={g.name} className="space-y-2">
                <div
                  className="h-24 rounded-xl"
                  style={{ background: g.var }}
                />
                <p className="text-sm font-medium">{g.label}</p>
                <p className="text-xs text-muted-foreground">--{g.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Типографика</h2>
          <div className="space-y-8">
            {/* Heading font */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Space Grotesk (Заголовки)</h3>
              <div className="space-y-2">
                <p className="font-heading text-4xl font-bold">Heading 1 — Заголовок</p>
                <p className="font-heading text-3xl font-bold">Heading 2 — Подзаголовок</p>
                <p className="font-heading text-2xl font-semibold">Heading 3 — Секция</p>
                <p className="font-heading text-xl font-semibold">Heading 4 — Подсекция</p>
              </div>
            </div>

            {/* Body font */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Inter (Основной текст)</h3>
              <div className="space-y-2">
                <p className="text-base">Основной текст — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Размер 16px, вес 400.</p>
                <p className="text-base font-medium">Средний вес — Lorem ipsum dolor sit amet. Размер 16px, вес 500.</p>
                <p className="text-sm text-muted-foreground">Вспомогательный текст — Lorem ipsum dolor sit amet. Размер 14px, мутед.</p>
              </div>
            </div>

            {/* Code font */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">JetBrains Mono (Код)</h3>
              <div className="space-y-2">
                <p className="font-code text-sm">const viably = createApp({"{"} theme: &quot;purple&quot; {"}"})</p>
                <p className="font-code text-sm font-medium">function handleClick() {"{"} return true {"}"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing Section */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Отступы</h2>
          <div className="space-y-3">
            {[
              { name: "4px", size: "w-1" },
              { name: "8px", size: "w-2" },
              { name: "12px", size: "w-3" },
              { name: "16px", size: "w-4" },
              { name: "24px", size: "w-6" },
              { name: "32px", size: "w-8" },
              { name: "48px", size: "w-12" },
              { name: "64px", size: "w-16" },
            ].map((space) => (
              <div key={space.name} className="flex items-center gap-4">
                <span className="w-12 text-sm text-muted-foreground">{space.name}</span>
                <div className={`h-4 rounded bg-primary ${space.size}`} />
              </div>
            ))}
          </div>
        </section>

        {/* Shadows Section */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Тени</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 rounded-xl bg-card shadow-sm border" />
              <p className="text-sm text-muted-foreground">shadow-sm</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 rounded-xl bg-card shadow-md border" />
              <p className="text-sm text-muted-foreground">shadow-md</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 rounded-xl bg-card shadow-lg border" />
              <p className="text-sm text-muted-foreground">shadow-lg</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 rounded-xl bg-card border" style={{ boxShadow: "0 0 40px var(--primary-glow)" }} />
              <p className="text-sm text-muted-foreground">glow</p>
            </div>
          </div>
        </section>

        {/* Border Radius Section */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Скругления</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { name: "rounded-sm", label: "Small" },
              { name: "rounded-md", label: "Medium" },
              { name: "rounded-lg", label: "Large" },
              { name: "rounded-xl", label: "XLarge" },
              { name: "rounded-2xl", label: "2XLarge" },
              { name: "rounded-full", label: "Full" },
            ].map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2">
                <div className={`h-20 w-20 bg-primary/20 border border-primary ${r.name}`} />
                <p className="text-sm text-muted-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Button Component */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Button</h2>
          <div className="space-y-6">
            {/* Variants */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Варианты</h3>
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            {/* Sizes */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Размеры</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">V</Button>
              </div>
            </div>
            {/* States */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Состояния</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled</Button>
                <Button loading>Загрузка</Button>
                <Button variant="secondary" loading>Загрузка</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Card Component */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Card</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Базовая карточка</CardTitle>
                <CardDescription>Описание карточки с мутед текстом</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Контент карточки. Наведите курсор, чтобы увидеть анимацию поднятия и градиентную полоску сверху.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Действие</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
                <CardDescription>Пример с числовыми данными</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">Активных пользователей</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>С бейджами</CardTitle>
                <CardDescription>Карточка с метками</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>Новое</Badge>
                  <Badge variant="success">Активно</Badge>
                  <Badge variant="warning">Внимание</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input Component */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Input</h2>
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <label htmlFor="input-default" className="text-sm font-medium">Обычный ввод</label>
              <Input id="input-default" placeholder="Введите текст..." />
            </div>
            <div className="space-y-2">
              <label htmlFor="input-email" className="text-sm font-medium">Email</label>
              <Input id="input-email" type="email" placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <label htmlFor="input-disabled" className="text-sm font-medium">Disabled</label>
              <Input id="input-disabled" disabled placeholder="Недоступно" />
            </div>
            <div className="space-y-2">
              <label htmlFor="input-password" className="text-sm font-medium">Пароль</label>
              <Input id="input-password" type="password" placeholder="••••••••" />
            </div>
          </div>
        </section>

        {/* Badge Component */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Badge</h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Варианты</h3>
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Animations Section */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-6">Анимации</h2>
          <div className="space-y-8">
            {/* GlowOrbs */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">GlowOrbs (фоновые)</h3>
              <div className="relative h-48 rounded-2xl border overflow-hidden bg-background">
                <GlowOrbs />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Подвигайте мышью для интерактивного эффекта</p>
                </div>
              </div>
            </div>

            {/* Shimmer */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Shimmer (загрузка)</h3>
              <div className="max-w-md space-y-3">
                <Shimmer height="1.5rem" width="60%" />
                <Shimmer height="1rem" />
                <Shimmer height="1rem" width="80%" />
              </div>
            </div>

            {/* FadeInUp */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">FadeInUp (скролл)</h3>
              <div className="space-y-4">
                <FadeInUp>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm">Этот блок появляется с анимацией снизу вверх при прокрутке.</p>
                  </div>
                </FadeInUp>
                <FadeInUp delay={0.1}>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm">Этот блок появляется с задержкой 0.1 секунды.</p>
                  </div>
                </FadeInUp>
                <FadeInUp delay={0.2}>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm">Этот блок появляется с задержкой 0.2 секунды.</p>
                  </div>
                </FadeInUp>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Примечание: все анимации отключаются при включенной настройке &quot;Уменьшить движение&quot; в ОС.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
