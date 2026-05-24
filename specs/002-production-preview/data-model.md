# Data Model: Production-Quality Preview System

**Feature**: 002-production-preview

---

## Entities & Types

### PreviewStatus

```typescript
// Состояние жизненного цикла превью
type PreviewStatus =
  | 'idle'          // Ещё не запущено
  | 'booting'       // WebContainer.boot() в процессе
  | 'installing'    // npm install запущен
  | 'starting'      // vite dev запущен, ждём server-ready
  | 'ready'         // Превью готово, URL получен
  | 'updating'      // Файлы обновляются (HMR)
  | 'error'         // Что-то пошло не так
  | 'unsupported'   // Браузер не поддерживает WebContainers → fallback
```

### PreviewState

```typescript
// Состояние хука useWebContainer
interface PreviewState {
  status: PreviewStatus
  url: string | null          // URL iframe (только при status='ready')
  progress: number            // 0-100 для прогресс-бара
  progressLabel: string       // Человекочитаемый статус для UI
  error: string | null        // Сообщение об ошибке
  isFallback: boolean         // true если используется Sandpack вместо WebContainers
}
```

### WebContainerFiles

```typescript
// Маппинг путь → содержимое файла
// Входной формат для preview-компонентов
type WebContainerFiles = Record<string, string>
// Пример: { 'src/App.tsx': '...', 'src/components/Hero.tsx': '...' }
```

### PreviewTemplateConfig

```typescript
// Конфигурация Vite-шаблона для WebContainer
interface PreviewTemplateConfig {
  packageJson: string        // JSON строка package.json
  viteConfig: string         // Содержимое vite.config.ts
  indexHtml: string          // Содержимое index.html
  tsconfigJson: string       // Содержимое tsconfig.json
  mainTsx: string            // Содержимое src/main.tsx
  indexCss: string           // Содержимое src/index.css
  uiComponents: Record<string, string>  // shadcn/ui компоненты: путь → содержимое
}
```

---

## State Transitions

```
idle ──boot()──► booting ──ready──► installing ──done──► starting ──server-ready──► ready
                    │                   │                    │                         │
                    ▼                   ▼                    ▼                         ▼
                  error               error               error                    updating
                                                                                      │
                                                                              (HMR обновление)
                                                                                      │
                                                                                    ready

unsupported (canRunWebContainers() = false) → рендерим SandpackPreview
```

---

## Progress Mapping

| Статус | progress | progressLabel |
|--------|----------|---------------|
| idle | 0 | — |
| booting | 10 | «Загрузка окружения...» |
| installing | 30 | «Установка зависимостей...» |
| starting | 70 | «Запуск сервера...» |
| ready | 100 | «Готово» |
| updating | 90 | «Обновление...» |
| error | — | — |

---

## FileSystemTree Structure

Входные `Artifact[]` конвертируются в `FileSystemTree` по следующим правилам:

```
Artifact.title          → путь в FileSystemTree
─────────────────────────────────────────────
"App.tsx"               → src/App.tsx
"src/App.tsx"           → src/App.tsx
"components/Hero.tsx"   → src/components/Hero.tsx
"*.css"                 → src/*.css (обрабатывается отдельно)
"main.tsx"              → ПРОПУСКАЕТСЯ (из шаблона)
"index.html"            → ПРОПУСКАЕТСЯ (из шаблона)
"vite.config.*"         → ПРОПУСКАЕТСЯ (из шаблона)
"package.json"          → ПРОПУСКАЕТСЯ (из шаблона)
```

Финальная структура FileSystemTree:
```
root/
├── package.json          ← шаблон
├── vite.config.ts        ← шаблон
├── index.html            ← шаблон
├── tsconfig.json         ← шаблон
└── src/
    ├── main.tsx          ← шаблон
    ├── index.css         ← шаблон + пользовательский CSS
    ├── App.tsx           ← из Artifact (или шаблон-заглушка)
    ├── [прочие артефакты из AI]
    └── components/
        └── ui/           ← pre-generated shadcn/ui компоненты (шаблон)
            ├── button.tsx
            ├── card.tsx
            └── ...
```
