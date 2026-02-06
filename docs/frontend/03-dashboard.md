# Frontend Module: Dashboard

## Описание
Главная страница после входа. Welcome card, статистика, быстрые действия, недавние проекты, daily bonus.

## Зависимости
- 01-design-system
- 02-auth-screens (auth state, user data)

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 1-2 дня

---

## Задачи

### Task 1: Dashboard Page Layout
**Файл:** `app/(main)/dashboard/page.tsx`
**Описание:** Основная структура dashboard с секциями

**Layout:**
- Main layout (navbar + content)
- Max-width 1280px, centered
- Секции: Welcome Card → Quick Actions → Recent Projects → Daily Bonus
- Staggered fadeInUp animation для каждой секции

**Acceptance Criteria:**
- [ ] Страница использует Main Layout (navbar)
- [ ] Все секции расположены вертикально
- [ ] fadeInUp анимация при загрузке

### Task 2: Welcome Card
**Файл:** `components/dashboard/welcome-card.tsx`
**Описание:** Большая карточка приветствия с stat cards внутри

**Элементы:**
- Gradient subtle bg (primary-subtle) + glow orb в углу
- "👋 Привет, {name}!" (Space Grotesk, 24px)
- 3 mini stat cards в ряд:
  - 💎 {credits} кредитов — Plan badge
  - 📦 {projects_count} проектов — "из {limit}"
  - 🟢 {deployed_count} deployed — "из {projects_count}"
- Stat cards: surface bg, border-radius 12px, mono font для чисел
- "+ Создать проект" (gradient button)
- "Пополнить кредиты →" (ghost link)

**Числа:** count-up анимация при первой загрузке (0 → actual value, 1s)

**Responsive:**
- Desktop: stat cards в ряд
- Mobile: stat cards в горизонтальный скролл или stack

**Acceptance Criteria:**
- [ ] Данные пользователя отображаются (mock data для MVP)
- [ ] Count-up анимация чисел
- [ ] Gradient subtle background
- [ ] Responsive layout

### Task 3: Quick Actions
**Файл:** `components/dashboard/quick-actions.tsx`
**Описание:** 2 карточки самых популярных шаблонов для быстрого старта

**Элементы:**
- Заголовок: "Быстрые действия"
- 2 карточки в ряд:
  - 🛒 Shop Bot — "Самый популярный" badge — [Создать →]
  - ❓ FAQ Bot — "Быстрый старт" badge — [Создать →]
- Cards: surface bg, hover lift, gradient line top on hover
- Click → navigate to `/templates/{slug}` или сразу `/projects/new?template={slug}`

**Acceptance Criteria:**
- [ ] 2 карточки с hover эффектами
- [ ] Badge поверх карточки
- [ ] Click навигация

### Task 4: Recent Projects
**Файл:** `components/dashboard/recent-projects.tsx`
**Описание:** Последние 3 проекта пользователя (или empty state)

**С проектами (grid 3 колонки):**
- Заголовок: "Мои проекты" + "Все проекты →" link
- Project cards (mini version):
  - Emoji + Name
  - Status badge (🟢 Deployed / 🟡 Ready / ⚪ Draft / 🔴 Failed)
  - Relative time: "2 часа назад"
  - Click → `/projects/{id}`

**Empty State:**
- Illustration (simple SVG или emoji-based)
- "У тебя пока нет проектов"
- "Создай первый бот за 60 секунд!"
- [Создать проект →] gradient button

**Acceptance Criteria:**
- [ ] Grid/list of projects
- [ ] Status badges with correct colors
- [ ] Empty state with CTA
- [ ] Hover effects on cards

### Task 5: Daily Bonus
**Файл:** `components/dashboard/daily-bonus.tsx`
**Описание:** Карточка с информацией о daily bonus и streak

**Элементы:**
- Subtle card (surface bg, border)
- 🎁 "+5 кредитов получено сегодня!" (или "Получи +5 кредитов" если не получены)
- Streak info: "Серия: 3 дня подряд ・ Завтра: +7 кредитов"
- Progress bar: gradient fill, "{days}/7 дней до бонуса x2"
- Claim button if not claimed today (gradient, small)

**States:**
- Already claimed today: info mode, green check
- Not claimed: CTA button to claim
- Streak milestones: 7 дней = x2 badge

**Acceptance Criteria:**
- [ ] Progress bar с gradient fill
- [ ] Streak counter
- [ ] Claim/claimed states
- [ ] Анимация при claim (confetti-lite или glow pulse)
