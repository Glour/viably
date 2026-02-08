# 🔥 Отчет по оптимизации памяти фронтенда

**Дата**: 2026-02-08
**Текущее потребление**: 1.1GB node_modules + 344MB .next кэша
**Проблема**: Избыточное потребление оперативной памяти при разработке

---

## 📊 Главные виновники (Top Offenders)

| Пакет | Размер | Проблема | Решение |
|-------|--------|----------|---------|
| `@next` + `next` | **384MB** | Next.js framework core | ✅ Необходим |
| `monaco-editor` | **76MB** | Полный VS Code редактор | ⚠️ МОЖНО ЗАМЕНИТЬ |
| `@opentelemetry` | **56MB** | Телеметрия (от Sentry) | ⚠️ Дев-зависимость? |
| `@sentry` | **52MB** | Мониторинг ошибок | ⚠️ Опционально в dev |
| `lucide-react` | **45MB** | 1000+ иконок | ⚠️ Tree-shaking проблема |
| `posthog-js` | **32MB** | Аналитика | ⚠️ Опционально в dev |
| `typescript` | **23MB** | TypeScript compiler | ✅ Необходим |
| `lightningcss-*` | **18MB** | 2 копии (musl + gnu) | ⚠️ Избыточность |
| `react-email` | **8MB** | Email templates | ⚠️ Переместить в devDeps |
| `playwright-core` | **10MB** | E2E testing | ⚠️ Переместить в devDeps |

**Итого проблемных пакетов**: ~350MB из 1.1GB

---

## 🎯 План оптимизации (в порядке приоритета)

### 1. 🔴 КРИТИЧНО: Заменить Monaco Editor (экономия ~70MB)
**Проблема**: Monaco Editor это полный VS Code редактор в браузере (76MB)
**Текущее использование**: Просто для показа кода в проектах

**Решение A (Рекомендуется)**: Использовать `react-syntax-highlighter` + `prism-react-renderer`
- Размер: ~500KB вместо 76MB
- Возможности: Подсветка синтаксиса, темы
- Уже используется `prism-react-renderer` в проекте!

**Решение B**: Если нужен легкий редактор → `@uiw/react-codemirror` (2MB)

**Действия**:
```bash
npm remove @monaco-editor/react
npm install react-syntax-highlighter @types/react-syntax-highlighter --save
# prism-react-renderer уже установлен
```

Файлы для замены:
- `src/components/project/code-viewer.tsx` (если есть)
- `src/app/projects/[id]/...` (все использования Monaco)

---

### 2. 🟡 СРЕДНЕ: Оптимизировать Sentry/PostHog для dev (экономия ~84MB)

**Проблема**: Sentry (52MB) + PostHog (32MB) = 84MB грузятся даже в dev mode

**Решение**: Условная загрузка только для production

```typescript
// next.config.ts - отключить Sentry wrapper в dev
const isDev = process.env.NODE_ENV === 'development'

export default isDev
  ? configWithAnalyzer  // без Sentry
  : withSentryConfig(configWithAnalyzer, { ... })
```

```typescript
// src/lib/posthog.ts - ленивая инициализация
export const initPostHog = () => {
  if (process.env.NODE_ENV === 'production') {
    return import('posthog-js').then(({ default: posthog }) => {
      posthog.init(...)
    })
  }
}
```

**Действия**:
1. Обновить `next.config.ts` - обернуть Sentry в условие
2. Обновить инициализацию PostHog - dynamic import

---

### 3. 🟢 ЛЕГКО: Переместить пакеты в devDependencies (экономия ~20MB)

**Проблема**: Production-only пакеты в `dependencies`

```json
"dependencies": {
  "react-email": "^5.2.8",           // Только для dev email preview
  "@react-email/components": "^1.0.7" // Только для dev
}
```

**Решение**:
```bash
npm install -D react-email @react-email/components
```

---

### 4. 🟡 СРЕДНЕ: Оптимизировать Lucide Icons (экономия ~30-40MB)

**Проблема**: `lucide-react` (45MB) грузит ВСЕ иконки, даже если используете 20

**Решение A (Tree-shaking)**: Проверить импорты
```typescript
// ❌ Плохо
import * as Icons from 'lucide-react'

// ✅ Хорошо
import { Settings, User, Home } from 'lucide-react'
```

**Решение B**: Использовать `@lucide/react` вместо `lucide-react` (меньший размер)

**Действия**:
1. Поиск плохих импортов: `grep -r "import.*from.*lucide-react" src/`
2. Заменить на именованные импорты

---

### 5. 🟢 ЛЕГКО: Очистить дублирующиеся зависимости (экономия ~10MB)

**Проблема**: 2 копии `lightningcss` (musl + gnu), возможно дубли других пакетов

**Решение**:
```bash
npm dedupe
npm prune
```

---

### 6. 🔵 БОНУС: Настроить Next.js production build

**Проблема**: `.next` кэш весит 344MB в dev mode

**Решение**: Добавить в `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Отключить source maps в dev (если не нужны)
  productionBrowserSourceMaps: false,
}
```

---

## 📈 Ожидаемый результат

| Оптимизация | Экономия памяти | Сложность |
|-------------|-----------------|-----------|
| Monaco → Prism | **-70MB** | 2-3 часа |
| Sentry/PostHog условно | **-84MB** | 30 мин |
| DevDeps | **-20MB** | 5 мин |
| Lucide tree-shaking | **-30MB** | 1 час |
| npm dedupe | **-10MB** | 1 мин |
| **ИТОГО** | **-214MB** (~20%) | **4-5 часов** |

**node_modules**: 1.1GB → ~886MB
**.next cache**: 344MB → ~300MB (с настройками)

---

## 🚀 Быстрая оптимизация (15 минут)

Если нужно СРОЧНО освободить память прямо сейчас:

```bash
# 1. Очистить кэши
rm -rf .next/cache
npm cache clean --force

# 2. Удалить дубликаты
npm dedupe
npm prune

# 3. Отключить sourcemaps в dev
echo "GENERATE_SOURCEMAP=false" >> .env.local

# 4. Перенести dev-only зависимости
npm install -D react-email @react-email/components @playwright/test
```

Экономия: **~50MB**, время: 15 мин

---

## ⚠️ Рекомендации

1. **НАЧАТЬ С**: Monaco → Prism (самый большой эффект)
2. **НЕ ТРОГАТЬ**: `@next`, `next`, `typescript`, `react` (необходимы)
3. **ОПЦИОНАЛЬНО**: Если Monaco нужен именно как редактор - использовать CodeMirror (2MB вместо 76MB)
4. **МОНИТОРИНГ**: После изменений запустить `npm run analyze` для проверки bundle size

---

## 🔗 Полезные команды

```bash
# Анализ размера бандла
ANALYZE=true npm run build

# Проверка размера пакета перед установкой
npx bundle-phobia <package-name>

# Найти дубликаты зависимостей
npm ls <package-name>

# Удалить неиспользуемые зависимости (осторожно!)
npx depcheck
```
