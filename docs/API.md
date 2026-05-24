# 🔌 API Viably

**Base URL:** `https://viably.io`  
**API Docs (dev only):** `http://localhost:8000/api-docs`

---

## Аутентификация

Viably использует JWT Bearer токены.

### Получение токена

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Ответ:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Использование токена

```http
GET /api/v1/users/me
Authorization: Bearer eyJ...
```

### Обновление токена

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

---

## Группы эндпоинтов

### Auth (`/api/v1/auth/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| POST | `/auth/register` | Регистрация нового пользователя |
| POST | `/auth/login` | Вход (email + password) |
| POST | `/auth/refresh` | Обновление access токена |
| POST | `/auth/logout` | Выход |
| POST | `/auth/verify-email` | Подтверждение email |
| POST | `/auth/resend-verification` | Повторная отправка подтверждения |
| POST | `/auth/forgot-password` | Запрос сброса пароля |
| POST | `/auth/reset-password` | Сброс пароля по токену |

### OAuth (`/api/v1/oauth/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/oauth/google` | Редирект на Google OAuth |
| GET | `/oauth/google/callback` | Callback от Google |
| GET | `/oauth/github` | Редирект на GitHub OAuth |
| GET | `/oauth/github/callback` | Callback от GitHub |

### Users (`/api/v1/users/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/users/me` | Текущий пользователь |
| PATCH | `/users/me` | Обновление профиля |
| GET | `/users/me/stats` | Статистика (кредиты, проекты, деплои) |
| GET | `/users/me/referrals` | Реферальная информация |

### Projects (`/api/v1/projects/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/projects` | Список проектов пользователя |
| POST | `/projects` | Создать новый проект |
| GET | `/projects/{id}` | Получить проект |
| PATCH | `/projects/{id}` | Обновить проект |
| DELETE | `/projects/{id}` | Удалить проект |
| POST | `/projects/{id}/deploy` | Задеплоить проект |
| DELETE | `/projects/{id}/deploy` | Остановить деплой |

### Conversations (`/api/v1/conversations/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/conversations` | Список бесед пользователя |
| POST | `/conversations` | Создать беседу |
| GET | `/conversations/{id}` | Получить беседу с сообщениями |
| DELETE | `/conversations/{id}` | Удалить беседу |
| GET | `/conversations/{id}/messages` | Список сообщений |
| GET | `/conversations/{id}/artifacts` | Артефакты беседы (код) |

### Templates (`/api/v1/templates/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/templates` | Список активных шаблонов |
| GET | `/templates/{slug}` | Получить шаблон по slug |

### Credits (`/api/v1/credits/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/credits/balance` | Текущий баланс кредитов |
| GET | `/credits/transactions` | История транзакций |
| POST | `/credits/daily-bonus` | Получить ежедневный бонус (claim) |
| GET | `/credits/daily-bonus/status` | Статус дневного бонуса |

### Payments (`/api/v1/payments/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| POST | `/payments/yookassa/create` | Создать платёж YooKassa |
| POST | `/payments/yookassa/webhook` | Webhook YooKassa |
| POST | `/payments/stripe/create-subscription` | Создать Stripe подписку |
| POST | `/payments/stripe/webhook` | Webhook Stripe |
| POST | `/payments/crypto/create` | Создать крипто-платёж |
| POST | `/payments/crypto/webhook` | Webhook NOWPayments |
| GET | `/payments/history` | История платежей |

### Deploy (`/api/v1/deploy/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/deploy/{project_id}/status` | Статус деплоя |
| GET | `/deploy/{project_id}/logs` | Логи деплоя |

### GitHub (`/api/v1/github/`)

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/github/repos` | Список репозиториев |
| POST | `/github/push/{project_id}` | Push кода в репозиторий |

### Admin (`/api/v1/admin/`) — требует is_admin=true

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/admin/users` | Список пользователей |
| PATCH | `/admin/users/{id}` | Изменить пользователя (план, кредиты) |
| GET | `/admin/stats` | Статистика платформы |
| GET | `/admin/payments` | Все платежи |

### Health

| Метод | Эндпоинт | Описание |
|-------|---------|---------|
| GET | `/health` | Health check backend |

---

## WebSocket — AI чат

**URL:** `wss://viably.io/ws/conversation/{conversation_id}?token={jwt}`

### Отправка сообщения

```json
{
  "type": "message",
  "content": "Добавь кнопку в меню бота"
}
```

### Получение событий (stream)

```json
{"type": "stream_start"}
{"type": "stream_token", "token": "Хорошо"}
{"type": "stream_token", "token": ", добавляю"}
{"type": "stream_end"}
{"type": "credits_used", "amount": 3, "remaining": 97}
{"type": "artifact_created", "artifact_id": "uuid", "title": "bot.py"}
```

### События деплоя

```json
{"type": "deployment_started", "deployment_id": "uuid"}
{"type": "deployment_status", "status": "building", "logs": "..."}
{"type": "deployment_complete", "url": "https://mybot.viably.io"}
{"type": "deployment_failed", "error": "Build failed"}
```

---

## Коды ошибок

| HTTP код | Описание |
|---------|---------|
| 400 | Bad Request — неверные параметры |
| 401 | Unauthorized — не авторизован |
| 403 | Forbidden — нет прав |
| 404 | Not Found — ресурс не найден |
| 422 | Unprocessable Entity — ошибка валидации |
| 429 | Too Many Requests — rate limit |
| 500 | Internal Server Error |

### Формат ошибки

```json
{
  "detail": "Insufficient credits",
  "code": "INSUFFICIENT_CREDITS",
  "required": 5,
  "available": 2
}
```

---

## Rate Limiting

- По умолчанию: 60 запросов/минуту на IP
- Для AI эндпоинтов: лимиты по плану
- При превышении: HTTP 429 + `Retry-After` header

---

## Примеры

### Создать проект

```bash
curl -X POST https://viably.io/api/v1/projects \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Мой Telegram бот",
    "template_id": "uuid-шаблона"
  }'
```

### Получить баланс кредитов

```bash
curl https://viably.io/api/v1/credits/balance \
  -H "Authorization: Bearer {token}"
```

Ответ:
```json
{
  "credits": 97,
  "plan": "starter",
  "daily_bonus_available": true
}
```
