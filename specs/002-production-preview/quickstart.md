# Quickstart: Production Preview System

**Feature**: 002-production-preview

Руководство для разработчика, который будет имплементировать фичу.

---

## Шаг 0: Подготовка

```bash
# Убедиться что на нужной ветке
git checkout 002-production-preview

# Установить новые зависимости
cd frontend
npm install @webcontainer/api @codesandbox/sandpack-react
```

---

## Шаг 1: COOP/COEP заголовки (next.config.ts)

Добавить только для маршрута проекта — не глобально:

```typescript
// frontend/next.config.ts
async headers() {
  return [
    {
      // Только страница проекта где живёт превью
      source: '/projects/:id',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    },
  ]
},
// Также добавить в transpilePackages:
transpilePackages: ['@webcontainer/api'],
```

---

## Шаг 2: Структура файлов для создания

```
frontend/src/shared/components/preview/
├── types.ts                 ← Копировать из specs/contracts/webcontainer-api.ts
├── browser-capabilities.ts  ← canRunWebContainers() + getBrowserCapabilities()
├── preview-template.ts      ← Vite template FileSystemTree (package.json, vite.config, etc.)
├── artifacts-to-fs.ts       ← Artifact[] → WCFileSystemTree конвертер
├── use-webcontainer.ts      ← React hook: boot, mount, spawn, HMR
├── WebContainerPreview.tsx  ← Основной preview компонент
├── SandpackPreview.tsx      ← Fallback для Safari/iOS
├── PreviewLoader.tsx        ← Loading state UI
├── PreviewError.tsx         ← Error state UI
└── index.ts                 ← Barrel: export { WebContainerPreview, ... }
```

---

## Шаг 3: Порядок реализации

### 3.1 `browser-capabilities.ts`
```typescript
export function canRunWebContainers(): boolean {
  if (typeof SharedArrayBuffer === 'undefined') return false
  if (!crossOriginIsolated) return false
  if (typeof Atomics.waitAsync !== 'function') return false
  return true
}
```

### 3.2 `preview-template.ts`
Константы — строковые содержимые файлов шаблона:
- `TEMPLATE_PACKAGE_JSON` — со всеми @radix-ui зависимостями
- `TEMPLATE_VITE_CONFIG` — с react + tailwindcss плагинами
- `TEMPLATE_INDEX_HTML` — стандартный Vite index.html
- `TEMPLATE_MAIN_TSX` — createRoot + App импорт
- `TEMPLATE_INDEX_CSS` — `@import "tailwindcss";`
- `UI_COMPONENTS` — shadcn/ui компоненты как Record<string, string>

### 3.3 `artifacts-to-fs.ts`
```typescript
export function artifactsToFileSystem(
  artifacts: Artifact[],
  options?: ArtifactsToFsOptions
): WCFileSystemTree
```
Логика:
1. Берём шаблон как основу
2. Для каждого Artifact: нормализуем путь (добавляем `src/` если нет)
3. Пропускаем: `main.tsx`, `index.html`, `vite.config.*`, `package.json`
4. CSS артефакты: мержим в `src/index.css` (после `@import "tailwindcss"`)
5. Строим вложенное дерево из плоских путей

### 3.4 `use-webcontainer.ts`
Hook со следующей логикой:
1. `start()`: boot → mount → npm install → vite dev → слушаем `server-ready`
2. `updateFiles()`: `webcontainerInstance.fs.writeFile()` для каждого изменённого файла (Vite HMR сработает автоматически)
3. Singleton: хранить WebContainer в `ref` — не пересоздавать при ре-рендере
4. Очистка в `useEffect` cleanup: `webcontainerInstance.teardown()`
5. Progress tracking через `installProcess.output` stream

### 3.5 `WebContainerPreview.tsx`
```tsx
"use client"
// 1. canRunWebContainers() → если false, рендерим SandpackPreview
// 2. Иначе: useWebContainer(artifacts)
// 3. Рендерим PreviewLoader пока status !== 'ready'
// 4. Рендерим iframe с url когда ready
// 5. Device size: width CSS на контейнере iframe
```

### 3.6 `SandpackPreview.tsx`
```tsx
"use client"
import { Sandpack } from '@codesandbox/sandpack-react'
// Конвертируем Artifact[] в Sandpack files формат
// Используем template="react-ts"
// externalResources: ['https://cdn.tailwindcss.com']
```

### 3.7 Замена `ArtifactPreviewPanel.tsx`
- Убрать `buildReactPreviewHTML()` функцию (600+ строк)
- Заменить `<HTMLPreview>` вызов на `<WebContainerPreview artifacts={artifacts} />`
- `HTMLPreview.tsx` сохранить — используется для `type === 'html'` артефактов (чистый HTML)

---

## Шаг 4: Проверка

```bash
# TypeScript проверка
cd frontend && npm run type-check

# Локальная сборка
npm run build

# E2E тест
npm run test:e2e
```

Ручная проверка чеклиста из PRD:
- [ ] Открыть в Chrome — превью рендерится
- [ ] Открыть в Safari (MacBook) — превью рендерится
- [ ] Открыть на iPhone — превью рендерится (Sandpack fallback)
- [ ] shadcn/ui компоненты работают (Button, Card, Dialog)
- [ ] Tailwind классы применяются
- [ ] Переключение desktop/tablet/mobile работает
- [ ] После отправки нового сообщения AI — превью обновляется

---

## Важные нюансы

1. **`"use client"` обязателен** на всех preview-компонентах — WebContainers работает только в браузере

2. **Singleton WebContainer**: `WebContainer.boot()` вызывать строго один раз. Используй ref:
   ```typescript
   const wcRef = useRef<WebContainer | null>(null)
   if (!wcRef.current) {
     wcRef.current = await WebContainer.boot()
   }
   ```

3. **`transpilePackages`**: `@webcontainer/api` — ESM-only пакет. Без этого Next.js выдаст ошибку парсинга.

4. **npm install прогресс**: читаем `installProcess.output` как ReadableStream и парсим строки для определения прогресса (искать `added N packages`)

5. **Vite HMR в iframe**: WebContainers предоставляет URL вида `https://xxxx.local-credentialless.webcontainer-api.io`. Этот URL уже настроен для HMR — просто ставим в `iframe.src`.

6. **shadcn/ui в шаблоне**: компоненты копируем из нашего проекта (`frontend/src/shared/ui/`), адаптируем для чистого React (убираем пути `@/`)
