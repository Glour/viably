# Quickstart: Dashboard

**Feature Branch**: `010-dashboard`
**Date**: 2026-02-06

## Prerequisites

- Node.js 18+
- Установленные зависимости: `cd frontend && npm install`
- Ветка: `git checkout 010-dashboard`

## Структура файлов

```
frontend/
├── app/
│   └── dashboard/
│       └── page.tsx                  # Dashboard page (модифицировать существующий)
├── components/
│   └── dashboard/
│       ├── welcome-card.tsx          # NEW: Welcome card с приветствием и статистикой
│       ├── quick-actions.tsx         # NEW: Карточки быстрых действий
│       ├── recent-projects.tsx       # NEW: Недавние проекты + empty state
│       └── daily-bonus.tsx           # NEW: Daily bonus с streak
├── hooks/
│   └── use-count-up.ts              # NEW: Hook для count-up анимации
├── lib/
│   ├── api/
│   │   └── dashboard.ts             # NEW: Mock API функции
│   └── utils/
│       └── format-relative-time.ts   # NEW: Утилита относительного времени
├── stores/
│   ├── dashboard.ts                  # NEW: Dashboard state store
│   └── daily-bonus.ts               # NEW: Daily bonus store (persist)
└── types/
    └── index.ts                      # MODIFY: Добавить новые типы
```

## Зависимости от Design System

Переиспользуемые компоненты (уже существуют):
- `components/ui/card.tsx` — Card, CardHeader, CardTitle, CardContent
- `components/ui/badge.tsx` — Badge с вариантами success, warning, secondary, destructive
- `components/ui/button.tsx` — Button с gradient и ghost вариантами
- `components/ui/shimmer.tsx` — Shimmer для skeleton loading
- `components/layout/main-layout.tsx` — MainLayout с Navbar
- `components/motion/fade-in-up.tsx` — FadeInUp с delay prop

CSS-переменные (уже определены):
- `--primary-subtle` — Subtle background для welcome card
- `--gradient-main` — Градиент для кнопок и декораций
- `--success`, `--warning` — Цвета статусов
- `glow-pulse` keyframes — Анимация при claim бонуса

## Порядок реализации

1. Типы и mock API (foundation)
2. Zustand stores (state layer)
3. Утилиты (useCountUp, formatRelativeTime)
4. Welcome Card (P1)
5. Recent Projects + Empty State (P2)
6. Quick Actions (P3)
7. Daily Bonus (P4)
8. Dashboard Page Assembly + Animations (P5)
9. Responsive polish + Skeleton loading

## Запуск

```bash
cd frontend
npm run dev
# Открыть http://localhost:3000/dashboard
```

## Проверка

```bash
cd frontend
npm run type-check    # TypeScript проверка
npm run build         # Проверка сборки
npm run lint          # ESLint проверка
```
