# Implementation Plan: Production-Quality Preview System

**Branch**: `002-production-preview` | **Date**: 2026-02-26 | **Spec**: `product-development/current-feature/PRD.md`

---

## Summary

Заменить самодельный Babel+stubs iframe-рендерер на WebContainers (`@webcontainer/api` v1.6.1) — реальный Node.js в WASM, работающий в браузере. Превью будет запускать настоящий Vite dev server внутри браузера и отображать результат в `<iframe>`. Sandpack (`@codesandbox/sandpack-react`) используется как fallback для Safari < 16.4 и iOS с ограниченной памятью. Изменения затрагивают только фронтенд (`frontend/`), бэкенд не меняется.

---

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router, Turbopack)
**Primary Dependencies**:
- `@webcontainer/api` v1.6.1 — основная preview-библиотека
- `@codesandbox/sandpack-react` v2.20.0 — fallback для Safari/iOS
**Storage**: N/A (state в памяти браузера, один WebContainer инстанс на сессию)
**Testing**: Playwright E2E (существующая инфраструктура)
**Target Platform**: Браузер (client-side only, no SSR для preview-компонентов)
**Project Type**: Web application (только frontend изменения)
**Performance Goals**: Первый рендер превью < 30 сек при холодном старте; < 5 сек при кешированных зависимостях
**Constraints**:
- COOP/COEP заголовки только на `/projects/[id]` маршруте (не глобально — сохранить PostHog)
- `WebContainer.boot()` вызывать не более одного раза за сессию страницы
- Нет доступа к SSR контексту из preview-компонентов (`"use client"` обязателен)
- `@webcontainer/api` — ESM-only пакет, требует `transpilePackages` в next.config.ts

---

## Constitution Check

**Principle I — Context-First**: ✅ Прочитан весь существующий preview-стек (`ArtifactPreviewPanel.tsx`, `HTMLPreview.tsx`, `preview-panel.tsx`, типы `Artifact`)

**Principle II — Single Source of Truth**: ✅ Типы WebContainer FileSystem будут определены в одном месте (`shared/components/preview/types.ts`), импортируются везде

**Principle III — Library-First**: ✅ Используем `@webcontainer/api` и `@codesandbox/sandpack-react` — проверенные библиотеки с тысячами звёзд и активной поддержкой

**Principle V — Strict Type Safety**: ✅ `@webcontainer/api` имеет полные TypeScript типы; никакого `any`

**Principle VII — Quality Gates**: COEP заголовки требуют проверки в CI (E2E тест что превью открывается)

**Complexity justification**: Два preview-рендерера (WebContainers + Sandpack fallback) — необходимо из-за Safari < 16.4 (не поддерживает `Atomics.waitAsync`). Более простая альтернатива (только Sandpack) не поддерживает Tailwind v4 через Vite plugin.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-production-preview/
├── plan.md              # Этот файл
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    └── webcontainer-api.ts   # TypeScript интерфейсы
```

### Source Code Changes

```text
frontend/
├── next.config.ts                          # + COOP/COEP headers для /projects/[id]
├── src/
│   ├── shared/
│   │   └── components/
│   │       ├── preview/                    # НОВАЯ директория
│   │       │   ├── WebContainerPreview.tsx # Основной компонент (WebContainers)
│   │       │   ├── SandpackPreview.tsx     # Fallback компонент
│   │       │   ├── PreviewLoader.tsx       # Loading states UI
│   │       │   ├── PreviewError.tsx        # Error states UI
│   │       │   ├── use-webcontainer.ts     # Hook: boot, mount, spawn
│   │       │   ├── preview-template.ts     # Vite template FileSystemTree builder
│   │       │   ├── artifacts-to-fs.ts      # Конвертер Artifact[] → FileSystemTree
│   │       │   ├── types.ts                # Общие типы
│   │       │   └── index.ts                # Barrel export
│   │       └── artifacts/
│   │           ├── ArtifactPreviewPanel.tsx    # ЗАМЕНЯЕТСЯ (убирается buildReactPreviewHTML)
│   │           └── HTMLPreview.tsx             # СОХРАНЯЕТСЯ для html-артефактов
│   └── features/
│       └── generation/
│           └── components/
│               └── complete-state.tsx      # ОБНОВЛЯЕТСЯ: использует новый preview
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Два preview-рендерера | Safari < 16.4 не поддерживает WebContainers | Только Sandpack не работает с Tailwind v4 через `@tailwindcss/vite` |
| COOP/COEP только на /projects | PostHog/analytics работают на других страницах | Глобальные заголовки ломают PostHog, Stripe |
