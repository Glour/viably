# Frontend Module: Landing Page

## Описание
Публичная landing page (viably.dev). Hero, How it works, Templates preview, Pricing, Footer. Максимум wow-эффектов.

## Зависимости
- 01-design-system (tokens, animations, glow orbs)

## Сложность: Средняя
## Приоритет: P1 (Should — можно после основного app)
## Estimated: 2 дня

---

## Задачи

### Task 1: Landing Layout & Nav
**Файл:** `app/(public)/page.tsx`, `components/landing/landing-nav.tsx`

**Nav (sticky, glass effect):**
- Logo | Features Pricing Docs | [Login] [Sign Up →] (gradient)
- Scroll: bg becomes glass (blur + opacity transition)
- Mobile: hamburger

### Task 2: Hero Section
**Файл:** `components/landing/hero.tsx`

- Badge: "✦ AI-Powered Bot Builder" (pill, gradient border)
- Heading: "Опиши идею.\nПолучи готовый бот.\nЗа 60 секунд." (Space Grotesk, 56px, gradient text на "бот")
- Subtitle: "Viably превращает твои идеи в работающие Telegram-боты. Без кода. Без знаний."
- Buttons: [◆ Начать бесплатно] (gradient) + [▷ Смотреть демо] (secondary, play icon)
- Social proof: "Уже 1,200+ ботов создано ✓"
- Glow orbs: 3 circles (purple, blue, cyan), react to mouse position
- Animated demo card: glass card showing mini Viably interface
  - Typing animation → code appearing → "Bot is live! ✓"
  - Loop every 8-10 seconds

### Task 3: How It Works
**Файл:** `components/landing/how-it-works.tsx`

- Heading: "Как это работает" (gradient underline)
- 3 step cards (staggered fadeInUp on scroll):
  1. ✎ Опиши идею — "Выбери шаблон и заполни пару полей"
  2. ⚡ AI генерирует код — "Смотри в реальном времени как код пишется"
  3. 🚀 Деплой одним кликом — "Бот работает через 60 секунд"
- Cards: surface bg, gradient number badge (circle), hover glow

### Task 4: Templates Preview
**Файл:** `components/landing/templates-preview.tsx`

- Heading: "Выбери шаблон и начни"
- Grid of 6 template cards (simplified version — emoji + name + cost)
- Hover effects
- [Смотреть все шаблоны →] link
- Staggered appear animation

### Task 5: Pricing Section
**Файл:** `components/landing/pricing.tsx`

- 3 columns: Free / Starter / Pro
- Free: 0₽, 10 кр/мес, 2 проекта, community support
- Starter: 990₽/мес, 100 кр, 10 проектов, priority support
- Pro: 2990₽/мес, unlimited, unlimited, custom deploy, **"Popular" badge + gradient border**
- Toggle: Monthly / Yearly (yearly = скидка 20%)
- CTA buttons: Free = "Начать бесплатно", Starter/Pro = "Выбрать план"

### Task 6: Footer
**Файл:** `components/landing/footer.tsx`

- 4 columns: Product, Resources, Company, Legal
- Social icons (Twitter, GitHub, Telegram)
- Copyright: "© 2025 Viably. All rights reserved."
- Subtle gradient line separator top

### Task 7: Scroll Animations
**Описание:** Framer Motion scroll-triggered animations

- All sections: fadeInUp on scroll into viewport
- Template cards: staggered (each +100ms delay)
- Pricing cards: staggered
- Stats counters: count-up when visible
- Parallax: glow orbs move slower than content on scroll

**Acceptance Criteria:**
- [ ] All sections render
- [ ] Animations trigger on scroll
- [ ] Responsive (all sections stack on mobile)
- [ ] Performance: no jank on scroll
- [ ] CTA buttons link to /register
