# Research: AI Code Generation Module

**Feature Branch**: `006-ai-generation`
**Date**: 2026-02-05

## 1. Library Decisions

### 1.1 Anthropic SDK (Claude API Client)

**Decision**: Use `anthropic>=0.20.0`

**Rationale**:
- Official Python SDK от Anthropic
- Полная поддержка async/await через `AsyncAnthropic`
- Встроенная поддержка streaming responses
- Type hints для всех API параметров
- High reputation, 93 code snippets в документации, Benchmark Score 73.7

**Alternatives Considered**:
- `langchain` - слишком heavy для простого использования одного LLM
- Direct HTTP calls - потеря типизации и retry logic

**Usage Pattern**:
```python
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

response = await client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=8192,
    system=system_prompt,
    messages=[{"role": "user", "content": prompt}]
)
```

### 1.2 Celery (Task Queue)

**Decision**: Use `celery>=5.3.0`

**Rationale**:
- Mature distributed task queue с 6000+ code snippets
- Benchmark Score 90.5 (highest among alternatives)
- Встроенная поддержка retry с exponential backoff
- Совместимость с FastAPI через asyncio.run()

**Alternatives Considered**:
- `arq` - Python async task queue, но меньше документации и community
- `dramatiq` - хорош, но Celery более распространён
- `rq` - проще, но нет встроенного exponential backoff

**Usage Pattern**:
```python
from celery import Celery

celery_app = Celery("ai_worker", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def process_generation(self, project_id: str):
    asyncio.run(_async_process(project_id))
```

### 1.3 Redis (Broker)

**Decision**: Use `redis>=5.0.0`

**Rationale**:
- Стандартный брокер для Celery
- Benchmark Score 89.3
- Отличная производительность для message queuing
- Уже используется в проекте (APScheduler)

**Alternatives Considered**:
- RabbitMQ - более надёжный для критичных задач, но оверхед для MVP
- Amazon SQS - требует AWS инфраструктуры

## 2. Technical Decisions

### 2.1 Sync vs Async Generation

**Decision**: Hybrid approach - синхронный API endpoint запускает асинхронную Celery task

**Rationale**:
- HTTP request завершается быстро (< 1 секунда)
- Пользователь сразу получает подтверждение
- Генерация выполняется в фоне (30-120 секунд)
- Статус доступен через GET /projects/{id}

**Implementation**:
1. POST /projects/{id}/generate → проверяет баланс, списывает кредиты, ставит задачу в очередь → возвращает project с status=generating
2. Celery worker выполняет генерацию
3. При успехе: status=ready, generated_code заполнен
4. При ошибке: status=error, кредиты возвращаются

### 2.2 Credit Deduction Strategy

**Decision**: Deduct BEFORE generation, refund on error

**Rationale**:
- Предотвращает race conditions (пользователь запускает 10 генераций одновременно)
- credits/service.py уже имеет `deduct_credits()` с SELECT FOR UPDATE
- Для refund используем `add_credits()` с transaction_type="generation_refund"

**Flow**:
```
1. Check balance >= 10 (template.credit_cost)
2. Deduct credits (atomic)
3. Queue generation task
4. If error in task → add_credits(10, "generation_refund")
```

### 2.3 Code Extraction Pattern

**Decision**: Regex extraction from markdown code blocks

**Rationale**:
- AI output формат: ` ```python\n# filename: path/to/file.py\n<code>\n``` `
- Простой и надёжный pattern matching
- Поддержка разных языков (python, yaml, json, dockerfile)

**Pattern**:
```python
pattern = r'```(?:python|dockerfile|yaml|json|txt)?\s*\n#\s*filename:\s*(.+?)\n(.*?)```'
```

### 2.4 Error Handling Strategy

**Decision**: Typed errors with automatic retry

**Rationale**:
- Временные ошибки (rate limit, timeout) → retry с exponential backoff
- Постоянные ошибки (invalid response, no code) → fail immediately
- Все ошибки логируются с correlation_id

**Categories**:
- `RetryableError`: APITimeoutError, RateLimitError → retry up to 3 times
- `PermanentError`: NoCodeExtractedError, TemplateNotFoundError → fail with refund

### 2.5 Project Status Lock

**Decision**: Reject concurrent generation for same project

**Rationale**:
- projects/routes.py:186 уже проверяет `status != DRAFT`
- Это предотвращает double-spending кредитов
- Статус GENERATING = lock

**Edge Case Resolution**:
- Проект в статусе ERROR можно регенерировать (нужно сначала PATCH status=draft)

## 3. Integration Points

### 3.1 Projects Module

**Existing Functions to Use**:
- `get_project_by_id(project_id, user_id, db)` - получение проекта
- `save_generated_code(project_id, code_files, ai_model, db)` - сохранение результата
- `set_error(project_id, error_message, db)` - установка ошибки

**No Changes Required**: Все функции уже реализованы в projects/service.py

### 3.2 Credits Module

**Existing Functions to Use**:
- `deduct_credits(user_id, amount, "generation", db, project_id)` - списание
- `add_credits(user_id, amount, "generation_refund", db)` - возврат

**No Changes Required**: credits/service.py полностью готов

### 3.3 Templates Module

**Existing Functions to Use**:
- `get_template_by_id(template_id, db)` - получение шаблона с prompt_template

**No Changes Required**: templates/service.py полностью готов

### 3.4 Auth Module

**Existing Dependencies to Use**:
- `get_current_user` - авторизация
- `get_current_admin_user` - для админского эндпоинта статуса

**Needed**: Создать `get_current_admin_user` если не существует

## 4. Configuration Requirements

### 4.1 New Environment Variables

```env
# AI
ANTHROPIC_API_KEY=sk-ant-...

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Generation
GENERATION_COST=10
GENERATION_MAX_TOKENS=8192
GENERATION_MODEL=claude-sonnet-4-20250514
```

### 4.2 Settings Updates

Добавить в `app/core/config.py`:
```python
# AI Generation
ANTHROPIC_API_KEY: str = ""
CELERY_BROKER_URL: str = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
GENERATION_COST: int = 10
GENERATION_MAX_TOKENS: int = 8192
GENERATION_MODEL: str = "claude-sonnet-4-20250514"
```

## 5. Scope Clarifications

### 5.1 Admin Endpoint Access

**Resolved**: Использовать существующий паттерн проверки `user.is_admin` (нужно проверить наличие поля)

### 5.2 Generation Status Polling

**Resolved**: Клиент polling через GET /projects/{id} каждые 5 секунд. WebSocket не нужен для MVP.

### 5.3 Concurrent Generation Lock

**Resolved**: Достаточно проверки `status == DRAFT`. Дополнительный pessimistic lock не нужен.

## 6. Dependencies Summary

```txt
# requirements.txt additions
anthropic>=0.20.0
celery>=5.3.0
redis>=5.0.0
```

## 7. No Research Needed

Все технические вопросы разрешены через анализ существующего кода и документации библиотек. Глубокое исследование не требуется.
