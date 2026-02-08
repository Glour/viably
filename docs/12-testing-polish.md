# Integration Module: E2E Testing & Polish

## Описание
End-to-end тестирование полного flow, bug fixes, responsive polish, performance optimization, подготовка к pre-launch.

## Зависимости
- 09, 10, 11 (вся интеграция завершена)

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 2-3 дня

---

## Задачи

### Task 1: E2E Tests — Critical Flows
**Файл:** `e2e/` директория, Playwright
**Описание:** Автоматизированные тесты основных user flows

**Test 1: Auth Flow**
```
1. Открыть /register
2. Заполнить форму → Submit
3. Проверить redirect на /dashboard
4. Проверить navbar показывает имя
5. Logout → redirect /login
6. Login с теми же credentials → dashboard
```

**Test 2: Template → Project → Generate Flow**
```
1. Login
2. Перейти /templates
3. Click на "FAQ Bot"
4. Click "Создать проект"
5. Проверить redirect на /projects/{id}/generate
6. Заполнить config form
7. Click "Генерировать"
8. Дождаться completion (или mock WS)
9. Проверить что код отображается
```

**Test 3: Deploy Flow**
```
1. На странице с generated кодом
2. Click "Deploy"
3. Ввести Bot Token
4. Click "Задеплоить"
5. Дождаться success
6. Проверить deployment info
```

**Test 4: Credits Flow**
```
1. Проверить начальный баланс
2. Создать проект + generate
3. Проверить баланс уменьшился
4. Claim daily bonus
5. Проверить баланс увеличился
```

**Test 5: Responsive**
```
1. Все critical flows на viewport 375px (mobile)
2. Navbar → hamburger
3. Generation → tabs вместо split
4. Templates → 1 column
```

**Acceptance Criteria:**
- [ ] Playwright настроен
- [ ] 5 основных test suites проходят
- [ ] CI/CD запускает тесты (optional для MVP)

### Task 2: Responsive Polish
**Описание:** Исправление responsive issues на всех страницах

**Проверить на breakpoints:**
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)
- 1024px (iPad landscape)
- 1440px (desktop)

**Common fixes:**
- Текст не обрезается
- Кнопки не выходят за экран
- Формы full-width на mobile
- Модалки → full-screen sheets на mobile
- Горизонтальный скролл отсутствует
- Touch targets min 44px
- Navbar → hamburger menu работает
- Generation split → tabs работает

**Acceptance Criteria:**
- [ ] Все страницы выглядят корректно на 5 breakpoints
- [ ] Нет горизонтального скролла
- [ ] Touch targets достаточного размера

### Task 3: Performance Optimization
**Описание:** Оптимизация загрузки и рендеринга

**Checklist:**
- [ ] Images: next/image с lazy loading
- [ ] Code splitting: dynamic imports для Monaco Editor, Framer Motion heavy components
- [ ] Bundle size: analyze with `next-bundle-analyzer`
- [ ] Fonts: preload Space Grotesk, Inter (display: swap)
- [ ] API: React Query prefetch для known navigation paths
- [ ] Animations: `will-change` для animated elements, GPU acceleration
- [ ] Lighthouse: target 90+ на mobile

**Key Optimizations:**
```typescript
// Monaco Editor — dynamic import (heavy ~2MB)
const CodeEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <CodeSkeleton />,
});

// Framer Motion — только нужные features
import { motion, AnimatePresence } from 'framer-motion';
// НЕ import * as framerMotion

// Glow orbs — отключить на mobile (performance)
const isMobile = useMediaQuery('(max-width: 768px)');
{!isMobile && <GlowOrbs />}
```

**Acceptance Criteria:**
- [ ] Monaco загружается lazy
- [ ] Bundle analyzed, нет неожиданных больших зависимостей
- [ ] Lighthouse mobile 90+
- [ ] Heavy animations отключены на mobile

### Task 4: SEO & Meta Tags
**Файл:** `app/layout.tsx`, page-level metadata
**Описание:** Базовый SEO для landing и public pages

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | Viably',
    default: 'Viably — AI-Powered Telegram Bot Builder',
  },
  description: 'Создавай Telegram-ботов за 60 секунд. Без кода. Без знаний. Просто опиши идею.',
  keywords: ['telegram bot', 'no-code', 'AI', 'bot builder', 'vibe coding'],
  openGraph: {
    title: 'Viably — AI-Powered Telegram Bot Builder',
    description: 'Создавай Telegram-ботов за 60 секунд.',
    url: 'https://viably.dev',
    siteName: 'Viably',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Viably — AI-Powered Telegram Bot Builder',
    description: 'Создавай Telegram-ботов за 60 секунд.',
  },
};
```

**Per-page metadata:**
- `/` — landing meta
- `/login`, `/register` — "Sign In/Up | Viably"
- `/templates` — "Bot Templates | Viably"
- `/templates/[slug]` — dynamic: "{template.name} | Viably"

**Acceptance Criteria:**
- [ ] Metadata на всех public pages
- [ ] Open Graph tags для social sharing
- [ ] robots.txt + sitemap.xml (basic)

### Task 5: Final Bug Fixes & QA
**Описание:** Ручное тестирование + исправление багов

**QA Checklist:**
- [ ] Регистрация → login → dashboard flow
- [ ] Template browsing → create project → generation → deploy
- [ ] Credit system: balance, daily bonus, deduction, refund
- [ ] Settings: profile update, password change, theme switch
- [ ] Dark mode: все страницы выглядят корректно
- [ ] Error states: network error, API error, validation errors
- [ ] Empty states: no projects, no credits, search no results
- [ ] Loading states: skeletons, spinners, button loading
- [ ] Navigation: все links работают, back button, breadcrumbs
- [ ] Toast notifications: success, error, info
- [ ] Mobile: hamburger menu, touch interactions

**Acceptance Criteria:**
- [ ] Все пункты QA checklist пройдены
- [ ] No critical bugs
- [ ] No console errors в production build
