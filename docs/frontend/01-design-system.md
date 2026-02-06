# Frontend Module: Design System & Foundation

## Описание
Настройка Next.js проекта, дизайн-системы, темы (light/dark), базовых компонентов и layout.

## Зависимости
- Нет (первый модуль)

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 1-2 дня

---

## Задачи

### Task 1: Next.js Project Setup
**Файл:** `package.json`, `next.config.js`, `tsconfig.json`
**Описание:** Инициализация Next.js 14 (App Router) + установка зависимостей
**Зависимости NPM:**
- tailwindcss, @tailwindcss/typography
- framer-motion
- lucide-react
- class-variance-authority, clsx, tailwind-merge
- next-themes (dark/light mode)
- @radix-ui/* (через shadcn/ui init)

**Acceptance Criteria:**
- [ ] `npm run dev` запускается без ошибок
- [ ] TypeScript strict mode
- [ ] App Router структура (`app/` directory)
- [ ] Tailwind настроен

### Task 2: Design Tokens (CSS Variables)
**Файл:** `app/globals.css`
**Описание:** CSS переменные для light и dark тем

**Light Theme:**
```css
:root {
  --background: #FFFFFF;
  --surface: #FAFAFA;
  --elevated: #F4F4F5;
  --subtle: #F8F8FC;
  --border: #E4E4E7;
  --text-primary: #09090B;
  --text-secondary: #52525B;
  --text-tertiary: #A1A1AA;
  --primary: #7C3AED;
  --primary-hover: #6D28D9;
  --primary-light: #8B5CF6;
  --primary-subtle: rgba(124, 58, 237, 0.08);
  --primary-glow: rgba(124, 58, 237, 0.4);
  --gradient-main: linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%);
  --gradient-warm: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%);
  --gradient-cool: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #2563EB;
}
```

**Dark Theme:**
```css
.dark {
  --background: #09090B;
  --surface: #18181B;
  --elevated: #27272A;
  --subtle: #111113;
  --border: #27272A;
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;
  --primary-subtle: rgba(124, 58, 237, 0.15);
}
```

**Acceptance Criteria:**
- [ ] Все цвета через CSS variables
- [ ] Dark mode переключается через class `.dark` на `<html>`
- [ ] next-themes подключён и работает

### Task 3: Typography Setup
**Файл:** `app/layout.tsx`, `app/fonts.ts`
**Описание:** Подключение шрифтов
- Headings: `Space Grotesk` (Google Fonts, weight 600-700, letter-spacing: -0.03em)
- Body: `Inter` (Google Fonts, weight 400-500)
- Code: `JetBrains Mono` (Google Fonts, weight 400-500)

**Acceptance Criteria:**
- [ ] Шрифты загружаются через `next/font/google`
- [ ] CSS classes: `.font-heading`, `.font-body`, `.font-code`
- [ ] Tailwind extend: fontFamily настроен

### Task 4: Base UI Components (shadcn/ui customized)
**Файлы:** `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `toggle.tsx`
**Описание:** Кастомизированные shadcn/ui компоненты под нашу дизайн-систему

**Button variants:**
- `primary`: gradient background (Main), white text, hover → translateY(-2px) + glow shadow
- `secondary`: surface bg, border, hover → border-color primary + subtle primary bg
- `ghost`: transparent, hover → subtle bg
- `danger`: red bg, white text
- Все: border-radius 12px, 300ms transitions, font 14px/600

**Card:**
- border-radius: 16px, 1px border, surface bg
- hover: translateY(-4px) + shadow increase + gradient line top (opacity 0→1) + border primary subtle
- transition: 400ms cubic-bezier(0.4, 0, 0.2, 1)

**Input:**
- border-radius: 12px, 1.5px border
- focus: border-color primary + box-shadow 0 0 0 4px primary-subtle

**Badge:**
- pill shape (border-radius: 100px), 13px/600
- Variants: primary, success, warning, neutral

**Acceptance Criteria:**
- [ ] Все компоненты работают в light и dark mode
- [ ] Hover/focus анимации плавные
- [ ] Gradient button glow работает
- [ ] Storybook-like preview page: `/dev/components`

### Task 5: Layout Components
**Файлы:** `components/layout/navbar.tsx`, `components/layout/main-layout.tsx`, `components/layout/sidebar.tsx`

**Navbar (sticky top, glass effect):**
- `backdrop-filter: blur(24px) saturate(180%)`, semi-transparent bg
- Left: Logo (gradient icon "V" + "Viably" text, Space Grotesk 700)
- Center: nav tabs — Dashboard, Templates, Projects (active = primary color + subtle bg)
- Right: Credits badge (gem + number, gradient bg), user avatar + dropdown
- Mobile: hamburger menu

**Main Layout:**
- Navbar top + content area below
- Max-width container: 1280px, centered, padding 24px
- No sidebar by default (sidebar only on specific pages)

**Sidebar (for generation/settings pages only):**
- Left panel, 280-360px width
- Surface bg, right border
- Collapse button on mobile

**Acceptance Criteria:**
- [ ] Glass navbar blur effect works
- [ ] Active tab highlighting
- [ ] Responsive: hamburger on mobile
- [ ] Credits badge visible
- [ ] Theme toggle in navbar or user dropdown

### Task 6: Animation Utilities
**Файл:** `lib/animations.ts`, `components/ui/glow-orbs.tsx`, `components/ui/shimmer.tsx`

**Glow Orbs:** Декоративные blur(80px) круги, float animation 8s, primary/blue/cyan, opacity 0.08 (light) / 0.15 (dark). React to mouse position (lag 0.8s via framer-motion).

**Shimmer:** Loading skeleton с gradient shimmer animation.

**fadeInUp:** Wrapper component for scroll-triggered fadeInUp (framer-motion useInView).

**Utility classes:**
- `.animate-float` — 8s ease-in-out infinite (translateY ±10px)
- `.animate-glow-pulse` — box-shadow pulse
- `.animate-shimmer` — gradient sweep

**Acceptance Criteria:**
- [ ] Glow orbs follow mouse with delay
- [ ] Shimmer works as loading skeleton
- [ ] fadeInUp triggers on scroll into view
- [ ] `prefers-reduced-motion` respected — all animations disabled
