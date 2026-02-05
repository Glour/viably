# Data Model: Projects Module

**Feature**: 005-projects-module
**Created**: 2026-02-05

---

## Entities

### Project

Основная сущность, представляющая пользовательский проект (бот или API сервис).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Уникальный идентификатор проекта |
| user_id | UUID | FK → users.id, NOT NULL | Владелец проекта |
| name | String(255) | NOT NULL, 1-255 chars | Название проекта |
| description | Text | nullable | Описание проекта |
| template_id | UUID | FK → templates.id, NOT NULL | Связь с шаблоном |
| config | JSON/JSONB | nullable | Пользовательская конфигурация |
| generated_code | JSON/JSONB | nullable | Сгенерированный код {files: {path: content}} |
| generation_logs | Text | nullable | Логи процесса генерации |
| ai_model_used | String(50) | nullable | Использованная AI модель |
| status | String(20) | NOT NULL, default="draft" | Статус жизненного цикла |
| error_message | Text | nullable | Сообщение об ошибке (для status=error) |
| deployed_url | Text | nullable | URL задеплоенного проекта |
| deploy_platform | String(50) | nullable | Платформа деплоя |
| is_public | Boolean | NOT NULL, default=false | Публичная видимость |
| created_at | DateTime(tz) | auto, NOT NULL | Время создания |
| updated_at | DateTime(tz) | auto on update | Время последнего обновления |
| generated_at | DateTime(tz) | nullable | Время завершения генерации |
| deployed_at | DateTime(tz) | nullable | Время деплоя |

**Индексы**:
- `projects_user_id_idx` on (user_id)
- `projects_status_idx` on (status)
- `projects_template_id_idx` on (template_id)
- `projects_created_at_idx` on (created_at DESC)

**Foreign Keys**:
- `user_id` → `users.id` (ON DELETE CASCADE)
- `template_id` → `templates.id` (ON DELETE RESTRICT)

---

### ProjectStatus (Enum)

| Value | Description | Next States |
|-------|-------------|-------------|
| draft | Черновик, можно редактировать | generating |
| generating | Идёт генерация кода | ready, error |
| ready | Код сгенерирован, готов к деплою | deploying |
| deploying | Идёт деплой | deployed, error |
| deployed | Задеплоен и работает | - |
| error | Ошибка на любом этапе | draft (reset) |

---

## State Transitions

```
┌─────────┐
│  draft  │ ──────────────────────────────────┐
└────┬────┘                                    │
     │ trigger_generation()                    │
     ▼                                         │
┌────────────┐                                 │
│ generating │ ───────────────┐                │
└─────┬──────┘                │                │
      │ success               │ error          │ reset
      ▼                       ▼                │
┌─────────┐              ┌─────────┐           │
│  ready  │              │  error  │ ◄─────────┤
└────┬────┘              └─────────┘           │
     │ deploy()                ▲               │
     ▼                         │               │
┌───────────┐                  │               │
│ deploying │ ─────────────────┘               │
└─────┬─────┘ error                            │
      │ success                                │
      ▼                                        │
┌──────────┐                                   │
│ deployed │ ◄─────────────────────────────────┘
└──────────┘
```

---

## Relationships

```
User (1) ─────< (N) Project
  │
  └── users.id = projects.user_id

Template (1) ─────< (N) Project
  │
  └── templates.id = projects.template_id
```

---

## Validation Rules

### Project.name
- Минимум 1 символ
- Максимум 255 символов
- Не может быть пустым

### Project.config
- Должна соответствовать template.config_schema (JSON Schema)
- Валидация при создании и обновлении проекта

### Project.status transitions
- `trigger_generation()` только из draft
- `save_generated_code()` только из generating
- `trigger_deploy()` только из ready
- `save_deploy_result()` только из deploying
- `set_error()` из любого состояния

---

## Config Schema Example

```json
{
  "type": "object",
  "properties": {
    "bot_name": {
      "type": "string",
      "title": "Bot Name",
      "minLength": 1,
      "maxLength": 100
    },
    "shop_name": {
      "type": "string",
      "title": "Shop Name"
    },
    "welcome_message": {
      "type": "string",
      "title": "Welcome Message",
      "default": "Welcome!"
    }
  },
  "required": ["bot_name"]
}
```

---

## Generated Code Structure Example

```json
{
  "files": {
    "bot.py": "import telebot\n\nbot = telebot.TeleBot('TOKEN')...",
    "requirements.txt": "pyTelegramBotAPI>=4.0.0\n",
    "config.py": "BOT_TOKEN = 'TOKEN'\n",
    "README.md": "# My Bot\n\nInstructions..."
  },
  "entry_point": "bot.py",
  "runtime": "python3.11"
}
```
