# Data Model: Deploy Module

**Feature Branch**: `007-deploy-module`
**Date**: 2026-02-05

## Entities

### Deployment

Запись о деплойменте проекта на внешнюю платформу.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Уникальный идентификатор деплоймента |
| project_id | UUID | FK → projects.id, NOT NULL | Связь с проектом |
| platform | String(50) | NOT NULL, default "railway" | Платформа деплоя |
| external_id | String(255) | NULLABLE | ID деплоймента на платформе |
| status | Enum | NOT NULL, default "pending" | Статус деплоймента |
| url | Text | NULLABLE | Публичный URL бота |
| build_url | Text | NULLABLE | URL логов сборки на платформе |
| admin_url | Text | NULLABLE | URL админ-панели платформы |
| logs | Text | NULLABLE | Текстовые логи |
| error_message | Text | NULLABLE | Сообщение об ошибке |
| platform_data | JSONB | NULLABLE | Метаданные платформы |
| created_at | DateTime(TZ) | NOT NULL, server_default=now() | Время создания |
| updated_at | DateTime(TZ) | NOT NULL, auto-update | Время обновления |
| deployed_at | DateTime(TZ) | NULLABLE | Время успешного деплоя |
| last_health_check | DateTime(TZ) | NULLABLE | Время последней проверки |

**Indexes**:
- `deployments_project_id_idx` on project_id
- `deployments_status_idx` on status
- `deployments_created_at_idx` on created_at DESC

**Relationships**:
- `project` → Project (many-to-one)
- Project.deployments ← Deployment[] (one-to-many)

---

### DeploymentStatus (Enum)

| Value | Description |
|-------|-------------|
| pending | Деплоймент создан, ожидает начала |
| building | Сборка на платформе |
| deploying | Развёртывание сервиса |
| active | Деплоймент активен и работает |
| failed | Ошибка деплоя |
| stopped | Остановлен пользователем |

**State Transitions**:
```
pending → building → deploying → active
                 ↘            ↘
                  failed        failed
active → stopped
stopped → pending (new deployment)
```

---

### DeploymentPlatform (Enum)

| Value | Description |
|-------|-------------|
| railway | Railway.app (основная платформа) |
| render | Render.com (резерв, не реализован) |

---

## Relationship with Project

Project model updates:

| Field | Change |
|-------|--------|
| deployments | NEW relationship: List[Deployment] |

Project.status values affected:
- `deploying` — когда deployment в статусах pending/building/deploying
- `deployed` — когда deployment.status = active
- `error` — когда deployment.status = failed

---

## Platform Data Structure

`platform_data` JSONB для Railway:

```json
{
  "railway_project_id": "string",
  "railway_service_id": "string",
  "railway_environment_id": "string"
}
```

---

## Validation Rules

1. **project_id**: Должен существовать и принадлежать текущему пользователю
2. **status**: Только значения из DeploymentStatus enum
3. **platform**: Только значения из DeploymentPlatform enum
4. **url**: Валидный HTTPS URL (если не null)
5. **platform_data**: Валидный JSON object (если не null)

---

## Migration Notes

1. Создать таблицу `deployments`
2. Добавить relationship в модель Project
3. Добавить индексы для оптимизации запросов
