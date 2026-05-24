# Research: Production-Quality Preview System

**Feature**: 002-production-preview
**Date**: 2026-02-26

---

## Решения (Decision Log)

### Decision 1: WebContainers как основной рендерер

**Decision**: `@webcontainer/api` v1.6.1 — основной механизм превью

**Rationale**:
- Запускает реальный Vite dev server в WASM Node.js прямо в браузере
- Поддерживает Tailwind v4 через `@tailwindcss/vite` plugin (критично — наш проект использует Tailwind v4)
- Нет серверных расходов (всё в браузере пользователя)
- Полная поддержка npm-зависимостей (`@radix-ui`, `lucide-react`, `shadcn/ui` компоненты)
- HMR работает — превью обновляется при изменении файлов без перезагрузки

**Alternatives considered**:
- **Sandpack** (`@codesandbox/sandpack-react` v2.20.0): не поддерживает Vite plugins → Tailwind v4 только через CDN. Используем как fallback.
- **Cloud VM** (Lovable-подход на Fly.io): дорого (4000+ VM постоянно), сложно в поддержке, избыточно для нашего scale.
- **Сохранить Babel+stubs**: не работает в Safari, нестабильно, не поддерживает реальные npm-зависимости.

**Library**: `@webcontainer/api` v1.6.1, ~1000 downloads/week, MIT, TypeScript-first, поддерживается StackBlitz

---

### Decision 2: Sandpack как fallback для Safari/iOS

**Decision**: `@codesandbox/sandpack-react` v2.20.0 для Safari < 16.4 и iOS с ограниченной памятью

**Rationale**:
- Safari < 16.4 не реализует `Atomics.waitAsync` — WebContainers падает
- iOS с ограниченной памятью (< 2GB доступно браузеру) — OOM при WebContainers boot
- Sandpack работает через CodeSandbox облачный bundler — не требует SharedArrayBuffer
- Поддерживает React 19 (`peerDeps: "react": "^16.8.0 || ^17 || ^18 || ^19"`)
- Tailwind через CDN (`externalResources: ['https://cdn.tailwindcss.com']`) — v3, не v4, но достаточно для fallback

**Feature detection** (когда использовать WebContainers vs Sandpack):
```typescript
function canRunWebContainers(): boolean {
  if (typeof SharedArrayBuffer === 'undefined') return false;
  if (!crossOriginIsolated) return false;
  if (typeof Atomics.waitAsync !== 'function') return false;
  return true;
}
```

**Library**: `@codesandbox/sandpack-react` v2.20.0, >50k downloads/week, Apache-2.0, TypeScript

---

### Decision 3: COOP/COEP только на маршруте проекта

**Decision**: Заголовки `COOP: same-origin` + `COEP: require-corp` применяются только к `/projects/:id`

**Rationale**:
- WebContainers требует `crossOriginIsolated = true` (оба заголовка обязательны)
- Глобальные заголовки сломают PostHog, Stripe, Google Fonts и другие сторонние скрипты
- PostHog не отдаёт `Cross-Origin-Resource-Policy: cross-origin` — будет заблокирован под `require-corp`
- Решение: scoped headers только для страниц с превью

**Implementation в `next.config.ts`**:
```typescript
async headers() {
  return [
    {
      source: '/projects/:id',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    },
  ];
}
```

**Why not `credentialless` COEP**: Safari не поддерживает `credentialless`. Нам нужно работать на Safari — значит `require-corp`, но только на нужных маршрутах.

---

### Decision 4: Vite шаблон с Tailwind v4 + shadcn/ui

**Decision**: Предустановленный шаблон Vite, включающий shadcn/ui компоненты как исходники

**Rationale**:
- shadcn/ui — не npm пакет, это генератор компонентов
- В WebContainer нельзя запустить `npx shadcn add button` (нет interactivity)
- Решение: pre-generate все стандартные shadcn/ui компоненты как файлы в шаблоне
- Включаем: `Button`, `Card`, `Input`, `Badge`, `Dialog`, `Select`, `Tabs`, `Avatar`, `Separator`, `Tooltip`, `DropdownMenu`
- `@radix-ui/*` пакеты в `dependencies` — ставятся через `npm install` как обычно

**Template package.json dependencies**:
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.469.0",
    "@radix-ui/react-dialog": "^1.1.5",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.1.7",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3"
  },
  "devDependencies": {
    "vite": "^6.0.11",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.6",
    "@tailwindcss/vite": "^4.0.6",
    "typescript": "^5.7.3",
    "@types/react": "^19.0.7",
    "@types/react-dom": "^19.0.3",
    "@types/node": "^22.10.7"
  }
}
```

---

### Decision 5: Singleton WebContainer per page session

**Decision**: Один экземпляр `WebContainer` на всё время жизни страницы (singleton pattern)

**Rationale**:
- `WebContainer.boot()` занимает 1-2 сек и потребляет память
- Повторный boot после unmount — OOM риск особенно на Safari
- При смене файлов — используем `webcontainerInstance.fs.writeFile()` + Vite HMR автоматически подхватывает
- Singleton хранится в React ref или module-level переменной

---

### Decision 6: Конвертация Artifact[] → FileSystemTree

**Decision**: Утилита `artifacts-to-fs.ts` конвертирует набор `Artifact` объектов в `FileSystemTree`

**Rationale**:
- Текущие артефакты приходят как плоский массив `Artifact[]` с полями `title` (путь) и `content`
- WebContainers принимает вложенный `FileSystemTree`
- Нужна чёткая логика маппинга: `title = "src/App.tsx"` → `{ src: { directory: { "App.tsx": { file: { contents } } } } }`
- CSS файлы: добавить в `src/` директорию
- `main.tsx` и `index.html` — из шаблона, не из артефактов (AI не генерирует entry points)

---

## Открытые вопросы (Resolved)

| Вопрос | Ответ |
|--------|-------|
| COOP/COEP совместимость с PostHog? | Scoped на `/projects/:id` → PostHog работает на других страницах |
| Safari SharedArrayBuffer? | Safari 15.2+ поддерживает, но WebContainers требует 16.4+. Fallback на Sandpack. |
| Sandpack vs WebContainers MVP? | WebContainers — основной; Sandpack — fallback по feature detection |
| Шаблон Vite для shadcn/ui? | Pre-generate компоненты как файлы, `@radix-ui/*` через npm |
| `@webcontainer/api` с Next.js 16? | Работает, нужен `transpilePackages` + `"use client"` |
