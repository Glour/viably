# Data Model: E2E Testing & Polish

**Branch**: `018-testing-polish`
**Date**: 2026-02-08

## Overview

This feature does not introduce new data entities or database changes. It focuses on testing infrastructure, UI polish, and metadata configuration.

## Entities

### Test Fixtures (in-memory, test-only)

Mock data used by Playwright tests to simulate API responses:

- **MockUser**: `{ id, email, name, token }` — test user for auth flows
- **MockTemplate**: `{ id, slug, name, description, category, complexity }` — template data for gallery tests
- **MockProject**: `{ id, name, templateId, status, createdAt }` — project data for project/generation tests
- **MockCredits**: `{ credits, dailyBonusAvailable, lastBonusClaim }` — credit balance for credits tests
- **MockGenerationMessage**: WebSocket messages (`progress`, `complete`, `error`) — generation flow simulation

### Page Metadata (static config)

Per-page metadata configuration — no database, static exports in page files:

| Route | Title Pattern | Has OG Tags |
|-------|--------------|-------------|
| `/` | `Viably — AI-Powered Bot Builder` | Yes (full) |
| `/login` | `Вход | Viably` | No |
| `/register` | `Регистрация | Viably` | No |
| `/forgot-password` | `Восстановление пароля | Viably` | No |
| `/dashboard` | `Дашборд | Viably` | No |
| `/templates` | `Шаблоны ботов | Viably` | No |
| `/templates/[slug]` | `{template.name} | Viably` (dynamic) | No |
| `/projects` | `Проекты | Viably` | No |
| `/projects/[id]` | `Проект | Viably` | No |
| `/projects/[id]/generate` | `Генерация | Viably` | No |
| `/settings/profile` | `Профиль | Viably` | No |
| `/settings/theme` | `Оформление | Viably` | No |
| `/settings/billing` | `Кредиты | Viably` | No |
| `/settings/plan` | `Тариф | Viably` | No |

## State Changes

No state store changes required. All data is either:
- Test fixtures (in `e2e/fixtures/`)
- Static metadata (in page files)
- Build-time configuration (`next.config.ts`, `playwright.config.ts`)
