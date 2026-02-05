# Research: Deploy Module

**Feature Branch**: `007-deploy-module`
**Date**: 2026-02-05

## Research Questions

### 1. Railway API Client Library

**Decision**: Использовать httpx для прямых GraphQL запросов

**Rationale**:
- Официальная Python библиотека для Railway API отсутствует
- httpx уже включён в проект (requirements.txt) для тестов
- GraphQL API Railway хорошо документирован
- Документация проекта (docs/backend/deploy-module.md) содержит готовые GraphQL запросы

**Alternatives considered**:
- gql (Python GraphQL client) — добавляет лишнюю зависимость, httpx достаточен для простых запросов
- requests — не поддерживает async

**Library**: httpx>=0.26.0 (уже установлен)

---

### 2. Railway API Endpoint & Authentication

**Decision**:
- Endpoint: `https://backboard.railway.app/graphql/v2`
- Auth: Bearer token через заголовок `Authorization`

**Rationale**: Официальная документация Railway API

**Configuration**: Добавить `RAILWAY_API_TOKEN` в Settings (app/core/config.py)

---

### 3. Deployment Status Polling Strategy

**Decision**: Синхронный polling с таймаутом 5 минут, интервал 10 секунд

**Rationale**:
- Railway API не предоставляет webhooks в бесплатном тарифе
- Polling каждые 10 секунд — компромисс между UX и rate limits
- 5 минут таймаут достаточен для большинства деплоев

**Alternatives considered**:
- WebSockets — Railway API не поддерживает
- Webhooks — недоступны в бесплатном тарифе
- Background Celery task — избыточно для MVP, добавить позже

**Future improvement**: Вынести polling в Celery worker для non-blocking UX

---

### 4. Source Code Upload Strategy

**Decision**: Railway CLI через temporary GitHub repository (упрощённая версия для MVP)

**Rationale**:
- Railway API предпочитает деплой из GitHub
- Прямая загрузка кода через API ограничена
- Для MVP: deploymentCreate mutation запускает деплой для уже связанного репозитория

**Note**: Документация проекта указывает на упрощённую версию. Для production нужна интеграция с GitHub API или Railway CLI.

---

### 5. Database Model Structure

**Decision**: Использовать структуру из docs/backend/deploy-module.md

**Key fields**:
- id (UUID, PK)
- project_id (FK → projects.id)
- platform (string, default "railway")
- external_id (string, Railway deployment ID)
- status (enum: pending/building/deploying/active/failed/stopped)
- url, build_url, admin_url (text)
- logs, error_message (text)
- platform_data (JSONB for Railway metadata)
- timestamps (created_at, updated_at, deployed_at, last_health_check)

**Rationale**: Покрывает все требования FR-008, расширяема для других платформ

---

### 6. Project Status Synchronization

**Decision**: Обновлять Project.status при изменении статуса деплоя

**Status mapping**:
- Deployment.pending → Project.deploying
- Deployment.building → Project.deploying
- Deployment.deploying → Project.deploying
- Deployment.active → Project.deployed
- Deployment.failed → Project.error
- Deployment.stopped → Project.ready (можно задеплоить заново)

**Rationale**: Соответствует FR-007, ProjectStatus enum уже содержит нужные статусы

---

### 7. Health Check Implementation

**Decision**: HTTP GET на deployment.url, статус <500 = healthy

**Rationale**:
- Простая проверка доступности
- Не требует изменений в сгенерированном коде бота
- Совместимо с любым web-сервисом

**Future improvement**: Добавить Celery periodic task для автоматических health checks

---

### 8. Security: BOT_TOKEN Handling

**Decision**:
- Не сохранять BOT_TOKEN в БД
- Не включать в логи
- Передавать напрямую в Railway env variables

**Rationale**: FR-003 требует установки env variables, но безопасность требует минимизации хранения секретов

---

## Dependencies Summary

**Existing (no changes needed)**:
- httpx>=0.26.0 (already in requirements.txt for testing)

**Configuration additions**:
- RAILWAY_API_TOKEN (Settings)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Railway API изменится | Medium | Версионирование API в клиенте, error handling |
| Rate limits | Low | 10s polling interval, exponential backoff |
| Source upload limitations | High | Документировать ограничения, roadmap для GitHub integration |
| Free tier limits | Medium | Мониторинг использования, документация для пользователей |
