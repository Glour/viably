# VIABLY Frontend — Orchestrator Workflow

## Структура спецификаций

```
docs/frontend/
├── 01-design-system.md      ← ПЕРВЫЙ (нет зависимостей)
├── 02-auth-screens.md       ← зависит от 01
├── 03-dashboard.md          ← зависит от 01, 02
├── 04-templates-gallery.md  ← зависит от 01
├── 05-projects.md           ← зависит от 01, 03
├── 06-generation-flow.md    ← зависит от 01, 04, 05 (САМЫЙ СЛОЖНЫЙ)
├── 07-settings.md           ← зависит от 01, 02
└── 08-landing-page.md       ← зависит от 01 (можно параллельно)
```

## Порядок имплементации

```
Неделя 1:
  01-design-system  →  02-auth-screens  →  03-dashboard

Неделя 2:
  04-templates-gallery  →  05-projects

Неделя 3-4:
  06-generation-flow (3-4 дня, самый сложный)

Неделя 4:
  07-settings  →  08-landing-page
```

---

## Команды для Claude Code (Orchestrator Kit)

### ШАГ 0: Подготовка

```bash
# Скопируй спеки в проект
cp docs/frontend/0*.md viably/docs/frontend/

# Убедись что .claude настроен
cd viably
cat .claude/settings.json  # должен быть BASE MCP
```

### ШАГ 1: Design System (01)

```bash
# 1. Анализ спецификации
/speckit.analyze docs/frontend/01-design-system.md

# 2. Создание плана задач
/speckit.plan

# 3. Имплементация каждой задачи по очереди:
/speckit.implement   # → Task 1: Next.js Project Setup
/speckit.implement   # → Task 2: Design Tokens
/speckit.implement   # → Task 3: Typography Setup
/speckit.implement   # → Task 4: Base UI Components
/speckit.implement   # → Task 5: Layout Components
/speckit.implement   # → Task 6: Animation Utilities

# 4. Проверка
/speckit.checklist

# 5. Коммит
/push patch
```

### ШАГ 2: Auth Screens (02)

```bash
/speckit.analyze docs/frontend/02-auth-screens.md
/speckit.plan
/speckit.implement   # → Task 1: Auth Layout
/speckit.implement   # → Task 2: Login Page
/speckit.implement   # → Task 3: Register Page
/speckit.implement   # → Task 4: Forgot Password
/speckit.checklist
/push patch
```

### ШАГ 3: Dashboard (03)

```bash
/speckit.analyze docs/frontend/03-dashboard.md
/speckit.plan
/speckit.implement   # → Task 1: Dashboard Page Layout
/speckit.implement   # → Task 2: Welcome Card
/speckit.implement   # → Task 3: Quick Actions
/speckit.implement   # → Task 4: Recent Projects
/speckit.implement   # → Task 5: Daily Bonus
/speckit.checklist
/push patch
```

### ШАГ 4: Templates Gallery (04)

```bash
/speckit.analyze docs/frontend/04-templates-gallery.md
/speckit.plan
/speckit.implement   # → Task 1: Gallery Page
/speckit.implement   # → Task 2: Template Card
/speckit.implement   # → Task 3: Template Data (Mock)
/speckit.implement   # → Task 4: Template Detail Page
/speckit.checklist
/push patch
```

### ШАГ 5: Projects (05)

```bash
/speckit.analyze docs/frontend/05-projects.md
/speckit.plan
/speckit.implement   # → Task 1: Projects List Page
/speckit.implement   # → Task 2: Project Card
/speckit.implement   # → Task 3: Project Detail Page
/speckit.implement   # → Task 4: Code Viewer (Monaco)
/speckit.implement   # → Task 5: Logs Viewer
/speckit.implement   # → Task 6: Project Settings Tab
/speckit.checklist
/push patch
```

### ШАГ 6: Generation Flow (06) — САМЫЙ ВАЖНЫЙ

```bash
/speckit.analyze docs/frontend/06-generation-flow.md
/speckit.plan

# Этот модуль сложнее — больше задач и зависимостей
/speckit.implement   # → Task 1: Generation Page Layout (split view)
/speckit.implement   # → Task 2: Chat Panel + Config Form
/speckit.implement   # → Task 3: Preview Panel (4 states)
/speckit.implement   # → Task 4: Generation Hook (WebSocket mock)
/speckit.implement   # → Task 5: Deploy Modal (3 phases)
/speckit.implement   # → Task 6: Mobile Adaptation

/speckit.checklist
/push patch
```

### ШАГ 7: Settings (07)

```bash
/speckit.analyze docs/frontend/07-settings.md
/speckit.plan
/speckit.implement   # → Task 1: Settings Layout
/speckit.implement   # → Task 2: Profile
/speckit.implement   # → Task 3: Billing & Credits
/speckit.implement   # → Task 4: Plan
/speckit.implement   # → Task 5: Theme
/speckit.checklist
/push patch
```

### ШАГ 8: Landing Page (08)

```bash
/speckit.analyze docs/frontend/08-landing-page.md
/speckit.plan
/speckit.implement   # → Task 1: Nav
/speckit.implement   # → Task 2: Hero
/speckit.implement   # → Task 3: How It Works
/speckit.implement   # → Task 4: Templates Preview
/speckit.implement   # → Task 5: Pricing
/speckit.implement   # → Task 6: Footer
/speckit.implement   # → Task 7: Scroll Animations
/speckit.checklist
/push patch
```

### ШАГ 9: Health Checks (после всех модулей)

```bash
/health-bugs         # Найти и исправить баги
/health-cleanup      # Убрать dead code
/health-reuse        # Консолидировать дублирование
/push minor          # → v0.1.0 (Frontend MVP!)
```

---

## Важные заметки

### CLAUDE.md для Frontend
Добавь в свой CLAUDE.md (behavioral OS):

```markdown
## Frontend Rules
- Use Next.js 14 App Router
- Use TypeScript strict mode
- Styling: Tailwind CSS + CSS variables (NO styled-components, NO CSS modules)
- Components: shadcn/ui customized to our design system
- Icons: lucide-react ONLY
- Animations: framer-motion
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (code)
- Primary color: #7C3AED (purple)
- Always support light AND dark themes
- Always respect prefers-reduced-motion
- Mobile-first responsive design
- All interactive elements: min 44px touch target on mobile
```

### Mock Data
Для MVP все данные — mock. Файлы в `lib/data/`:
- `templates.ts` — 6 шаблонов
- `projects.ts` — 3 mock проекта
- `user.ts` — mock user data
- `generation.ts` — mock generation steps/code

Подключение к реальному API — отдельная фаза после frontend MVP.

### State Management
- **Server state:** React Query (TanStack Query) — API calls, caching
- **Client state:** Zustand — theme, sidebar state, generation state
- **Form state:** React Hook Form + Zod
- **URL state:** Next.js searchParams для tabs, filters

### Тестирование
После каждого модуля:
```bash
npm run build          # Проверить что билдится
npm run lint           # ESLint
npm run type-check     # TypeScript
```
