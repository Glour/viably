# Tasks: Production-Quality Preview System

**Feature**: 002-production-preview
**Input**: `specs/002-production-preview/` (plan.md, PRD.md, research.md, data-model.md, contracts/, quickstart.md)
**Branch**: `002-production-preview`

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Можно выполнять параллельно (разные файлы, нет блокирующих зависимостей)
- **[Story]**: User story к которой относится задача (US1–US4)
- Тесты не включены (не запрошены в PRD)

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Подготовка к имплементации — анализ задач, создание агентов, распределение исполнителей.

- [x] P001 Analyze all tasks and identify required agent types and capabilities
- [x] P002 Create missing agents using meta-agent-v3 (launch N calls in single message, 1 per agent), then ask user restart → No new agents needed, fullstack-nextjs-specialist covers all complex tasks
- [x] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names → See annotations below
- [x] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/) → All resolved in research.md

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single npm install)
- **Existing agents**: ONLY if 100% capability match after thorough examination
- **After P002**: Must restart claude-code before proceeding to P003

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Установка зависимостей и конфигурация окружения — блокирует все последующие фазы.

- [ ] T001 Install @webcontainer/api v1.6.1 and @codesandbox/sandpack-react v2.20.0 in `frontend/package.json`
- [ ] T002 Add `transpilePackages: ['@webcontainer/api']` to `frontend/next.config.ts`
- [ ] T003 Add COOP/COEP headers scoped to `/projects/:id` route in `frontend/next.config.ts`
- [ ] T004 Create directory `frontend/src/shared/components/preview/` with `index.ts` barrel export

**Checkpoint**: Зависимости установлены, заголовки настроены, директория создана.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Базовые утилиты и шаблон — должны быть готовы до реализации любой User Story.

**⚠️ CRITICAL**: Никакая User Story не начинается до завершения этой фазы.

- [ ] T005 [P] Create types in `frontend/src/shared/components/preview/types.ts` — скопировать и адаптировать из `specs/002-production-preview/contracts/webcontainer-api.ts` (PreviewStatus, PreviewState, WebContainerFiles, WCFileSystemTree, PreviewTemplateConfig, UseWebContainerReturn, ProductionPreviewProps, DeviceSize, BrowserCapabilities)
- [ ] T006 [P] Create `frontend/src/shared/components/preview/browser-capabilities.ts` — реализовать `canRunWebContainers(): boolean` и `getBrowserCapabilities(): BrowserCapabilities` (проверки: SharedArrayBuffer, crossOriginIsolated, Atomics.waitAsync)
- [ ] T007 Create `frontend/src/shared/components/preview/preview-template.ts` — константы Vite шаблона: `TEMPLATE_PACKAGE_JSON` (с @radix-ui/* зависимостями из research.md Decision 4), `TEMPLATE_VITE_CONFIG` (react + @tailwindcss/vite плагины, host: '0.0.0.0'), `TEMPLATE_INDEX_HTML`, `TEMPLATE_TSCONFIG`, `TEMPLATE_MAIN_TSX`, `TEMPLATE_INDEX_CSS` (`@import "tailwindcss"`), и `buildPreviewTemplate(): PreviewTemplateConfig`
- [ ] T008 Create `frontend/src/shared/components/preview/ui-components.ts` — pre-generated shadcn/ui компоненты как `UI_COMPONENTS: Record<string, string>`: адаптировать из `frontend/src/shared/ui/` (button, card, input, badge, dialog, select, tabs, avatar, separator, tooltip, dropdown-menu) — заменить пути `@/` на относительные, убрать next-специфичные импорты
- [ ] T009 Create `frontend/src/shared/components/preview/artifacts-to-fs.ts` — функция `artifactsToFileSystem(artifacts: Artifact[], options?: ArtifactsToFsOptions): WCFileSystemTree`. Логика: взять шаблон как базу, нормализовать пути артефактов (добавить `src/` если нет), пропустить системные файлы (main.tsx, index.html, vite.config.*, package.json), CSS мержить в src/index.css после `@import "tailwindcss"`, построить вложенное дерево из плоских путей

**Checkpoint**: Базовые утилиты готовы, шаблон определён, конвертер работает.

---

## Phase 3: User Story 1 — WebContainer Preview (Основное превью) 🎯 MVP

**Goal**: Пользователь видит работающее превью React+Tailwind+shadcn/ui в WebContainers (реальный Vite в браузере). Превью работает в Chrome/Edge/Firefox и Safari 16.4+.

**Independent Test**: Открыть страницу проекта в Chrome → AI генерирует React компонент → превью показывает работающий UI с анимациями и кликабельными shadcn/ui кнопками.

- [ ] T010 [US1] Create `frontend/src/shared/components/preview/use-webcontainer.ts` — React hook реализующий `UseWebContainerReturn`. Логика: singleton WebContainer в `useRef` (boot только один раз), `start()`: boot → mount(artifactsToFileSystem) → spawn('npm', ['install']) → spawn('npm', ['run', 'dev']) → слушать 'server-ready' → установить url, прогресс через `installProcess.output` stream (парсить строки для progress 30→70), `updateFiles()`: `wc.fs.writeFile()` для изменённых файлов (HMR сработает), cleanup в useEffect: `wc.teardown()`, обработка ошибок → status='error'
- [ ] T011 [US1] Create `frontend/src/shared/components/preview/PreviewLoader.tsx` — `"use client"` компонент отображающий прогресс загрузки: анимированный прогресс-бар (0-100), метка этапа (`progressLabel`), этапы: «Загрузка окружения...» / «Установка зависимостей...» / «Запуск сервера...»; использовать существующие shadcn/ui компоненты из `@/shared/ui/`
- [ ] T012 [US1] Create `frontend/src/shared/components/preview/PreviewError.tsx` — `"use client"` компонент ошибки: показывает `error` текст, кнопка «Перезапустить» (`onRetry`), дизайн: ошибка в коде проекта, не ошибка платформы; использовать `@/shared/ui/button`
- [ ] T013 [US1] Create `frontend/src/shared/components/preview/WebContainerPreview.tsx` — `"use client"` основной компонент. Принимает `ProductionPreviewProps` (artifacts, deviceSize, className). Логика: `canRunWebContainers()` → если false, рендерить `<SandpackPreview>`; иначе `useWebContainer({artifacts, autoStart: true})`; при status!='ready' → `<PreviewLoader>`; при status='error' → `<PreviewError onRetry={start}`; при status='ready' → `<iframe src={url}>` с шириной по `deviceSize` (desktop: 100%, tablet: 768px, mobile: 375px); при изменении `artifacts` → вызывать `updateFiles(artifacts)`
- [ ] T014 [US1] Update `frontend/src/shared/components/preview/index.ts` — экспортировать `WebContainerPreview`, `PreviewLoader`, `PreviewError`, типы из `types.ts`

**Checkpoint**: `WebContainerPreview` работает в Chrome. Shadcn/ui компоненты рендерятся корректно. Tailwind классы применяются.

---

## Phase 4: User Story 2 — Sandpack Fallback (Safari & iOS поддержка)

**Goal**: Пользователь на iPhone или Safari < 16.4 видит работающее превью через Sandpack fallback (без WebContainers). Превью использует Tailwind CDN и показывает React компоненты без ошибок.

**Independent Test**: Открыть страницу проекта в Safari на iPhone (или эмуляторе) → превью рендерится без пустого экрана → кнопки кликабельны.

- [ ] T015 [US2] Create `frontend/src/shared/components/preview/SandpackPreview.tsx` — `"use client"` компонент. Конвертировать `Artifact[]` в Sandpack `files` формат (`Record<string, {code: string}>`). Использовать `<SandpackProvider template="react-ts" theme="dark">` + `<SandpackPreview showOpenInCodeSandbox={false} />`. `customSetup.externalResources: ['https://cdn.tailwindcss.com']`. Добавить зависимости из артефактов (lucide-react, clsx, tailwind-merge). DeviceSize: обернуть SandpackPreview в div с соответствующей шириной. Не показывать редактор кода — только превью.

**Checkpoint**: `SandpackPreview` отображает React компоненты в Safari. Кнопки работают. Tailwind классы применяются (через CDN v3).

---

## Phase 5: User Story 3 — Интеграция в ArtifactPreviewPanel

**Goal**: Старый `buildReactPreviewHTML` Babel+stubs механизм полностью заменён. `ArtifactPreviewPanel` использует `WebContainerPreview`. Device switcher (desktop/tablet/mobile) работает. Превью обновляется после AI регенерации.

**Independent Test**: В существующем UI проекта вкладка «Предпросмотр» показывает WebContainers превью вместо старого iframe. Переключение устройств меняет ширину. После отправки нового сообщения AI — превью обновляется без перезагрузки страницы.

- [ ] T016 [US3] Refactor `frontend/src/shared/components/artifacts/ArtifactPreviewPanel.tsx` — убрать функцию `buildReactPreviewHTML` и весь связанный код (~600 строк), заменить рендеринг превью-вкладки на `<WebContainerPreview artifacts={artifacts} deviceSize={deviceSize} />`, передавать `deviceSize` из существующего `ViewMode` переключателя (`ArtifactToolbar`), сохранить `HTMLPreview` для `type === 'html'` артефактов
- [ ] T017 [US3] Update `frontend/src/shared/components/artifacts/index.ts` — добавить реэкспорт из `@/shared/components/preview` если нужно для обратной совместимости

**Checkpoint**: Страница проекта рендерит WebContainers превью. Старый Babel код удалён. Device switcher работает.

---

## Phase 6: User Story 4 — UX: Loading States & Error Handling

**Goal**: Пользователь видит понятный прогресс загрузки (не пустой экран). При ошибке сборки видит осмысленное сообщение с возможностью перезапуска. Превью не блокирует доступ к редактору кода во время загрузки.

**Independent Test**: Первый запуск превью → видны этапы загрузки → через < 30 сек превью готово. Сломанный код → показывается «Ошибка в коде» с кнопкой перезапуска.

- [ ] T018 [US4] Update `frontend/src/shared/components/preview/PreviewLoader.tsx` — добавить прогресс-бар с анимацией, отображать текущий этап из `progressLabel`, стилизовать в соответствии с дизайн-системой проекта (использовать цвета `--primary`, `--muted`), добавить skeleton-заглушку чтобы layout не прыгал
- [ ] T019 [US4] Update `frontend/src/shared/components/preview/PreviewError.tsx` — различать типы ошибок: «Ошибка в коде проекта» (build error от Vite) vs «Ошибка превью» (WebContainer boot fail); для build errors показывать первые строки stderr; добавить кнопку «Открыть код» переключающую на вкладку «Код»
- [ ] T020 [US4] Update `frontend/src/shared/components/preview/use-webcontainer.ts` — парсить stderr из Vite процесса для различения build errors vs system errors; добавить timeout (60 сек) на npm install с понятным сообщением; логировать WebContainer events через `structlog`-compatible console.error для Sentry

**Checkpoint**: Loading states работают. Build errors показываются с контекстом. Timeout обрабатывается корректно.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Очистка, проверка производительности, финальная валидация.

- [ ] T021 [P] Delete `frontend/src/shared/components/artifacts/ArtifactPreviewPanel.tsx.bak` и `ArtifactPreviewPanel.tsx.bak2` — убрать устаревшие backup файлы
- [ ] T022 [P] Run `npm run type-check` in `frontend/` — убедиться что TypeScript не выдаёт ошибок в новых файлах
- [ ] T023 [P] Run `npm run build` in `frontend/` — убедиться что production build проходит
- [ ] T024 Verify COOP/COEP headers не сломали PostHog: открыть любую страницу кроме `/projects/:id` → проверить что PostHog events отправляются в Network tab
- [ ] T025 Run manual acceptance checklist from `specs/002-production-preview/quickstart.md` — пройти все пункты вручную

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Нет зависимостей — можно начать сразу
- **Foundational (Phase 2)**: Зависит от Phase 1 — **блокирует все User Stories**
- **US1 WebContainer (Phase 3)**: Зависит от Phase 2 — основной MVP
- **US2 Sandpack Fallback (Phase 4)**: Зависит от Phase 2 — можно параллельно с US1
- **US3 Интеграция (Phase 5)**: Зависит от US1 (T013) и US2 (T015) — нужны оба компонента
- **US4 UX (Phase 6)**: Зависит от US1 и US3 — улучшает существующие компоненты
- **Polish (Phase 7)**: Зависит от всех предыдущих фаз

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational: T005-T009)
    ↓             ↓
Phase 3 (US1)  Phase 4 (US2)   ← Параллельно
    ↓             ↓
Phase 5 (US3) ← Нужны оба US1 + US2
    ↓
Phase 6 (US4)
    ↓
Phase 7 (Polish)
```

### Parallel Opportunities

- **T005 и T006**: параллельно (разные файлы, нет зависимостей между собой)
- **T007, T008, T009**: T007 и T008 параллельно; T009 зависит от T007 (нужен шаблон)
- **Phase 3 и Phase 4**: полностью параллельно (разные компоненты)
- **T021, T022, T023**: параллельно (Polish фаза)

---

## Parallel Example: Phase 2 (Foundational)

```
# Запустить одновременно:
Agent A: T005 — types.ts
Agent B: T006 — browser-capabilities.ts
Agent C: T007 — preview-template.ts

# После завершения T007:
Agent D: T008 — ui-components.ts  (параллельно)
Agent E: T009 — artifacts-to-fs.ts (нужен T007)
```

## Parallel Example: Phase 3 + Phase 4

```
# После завершения Phase 2:
Agent A: T010 → T011 → T012 → T013 → T014  (US1, последовательно)
Agent B: T015  (US2, независимо)
```

---

## Implementation Strategy

### MVP (US1 Only — WebContainer Preview)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009)
3. Complete Phase 3: US1 (T010-T014)
4. **STOP and VALIDATE**: Открыть в Chrome, убедиться что превью работает
5. Продолжить Phase 4-7 после валидации MVP

### Incremental Delivery

1. **Setup + Foundational** → базовая инфраструктура готова
2. **+ US1** → Chrome/Edge/Firefox превью работает (MVP ✓)
3. **+ US2** → Safari/iPhone превью через Sandpack
4. **+ US3** → старый Babel код удалён, интеграция в UI
5. **+ US4** → полированный UX со loading states
6. **+ Polish** → финальная проверка, cleanup

---

## Summary

| Метрика | Значение |
|---------|----------|
| Всего задач (без P00x) | 25 задач |
| Phase 1 (Setup) | 4 задачи |
| Phase 2 (Foundational) | 5 задач |
| Phase 3 (US1 — MVP) | 5 задач |
| Phase 4 (US2 — Safari) | 1 задача |
| Phase 5 (US3 — Интеграция) | 2 задачи |
| Phase 6 (US4 — UX) | 3 задачи |
| Phase 7 (Polish) | 5 задач |
| Параллельных возможностей | 3 группы |
| MVP scope | Phase 1 + 2 + 3 (14 задач) |
