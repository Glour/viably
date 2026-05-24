# 🗄️ База данных Viably

**СУБД:** PostgreSQL 16  
**База данных:** `viably`  
**Пользователь:** `postgres`

---

## Таблицы

### `users` — Пользователи

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `email` | varchar(255) | Email (уникальный) |
| `password_hash` | varchar(255) | Хэш пароля |
| `full_name` | varchar(255) | Полное имя |
| `avatar_url` | varchar | URL аватара |
| `plan` | varchar(20) | Тариф: free/starter/pro/business/enterprise |
| `credits` | integer | Текущий баланс кредитов |
| `referral_code` | varchar(8) | Уникальный реферальный код |
| `referred_by` | uuid → users | Кто пригласил |
| `is_active` | boolean | Активен ли аккаунт |
| `is_verified` | boolean | Подтверждён ли email |
| `is_admin` | boolean | Права администратора |
| `stripe_customer_id` | varchar(255) | Stripe Customer ID |
| `subscription_status` | varchar(20) | Статус подписки (inactive/active/canceled) |
| `subscription_current_period_end` | timestamptz | Дата окончания подписки |
| `subscription_cancel_at_period_end` | boolean | Отменить в конце периода |
| `github_access_token` | varchar(255) | GitHub OAuth токен |
| `oauth_provider` | varchar(20) | OAuth провайдер (google/github) |
| `github_username` | varchar(100) | GitHub username |
| `created_at` | timestamptz | Дата регистрации |
| `updated_at` | timestamptz | Дата обновления |
| `last_login_at` | timestamptz | Последний вход |

**Индексы:** PK(id), UNIQUE(email), UNIQUE(referral_code), UNIQUE(stripe_customer_id)

---

### `projects` — Проекты пользователей

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `user_id` | uuid → users | Владелец проекта |
| `name` | varchar(255) | Название проекта |
| `description` | text | Описание |
| `template_id` | uuid → templates | Шаблон (опционально) |
| `config` | json | Конфигурация проекта |
| `generated_code` | json | Последний сгенерированный код |
| `generation_logs` | text | Логи генерации |
| `ai_model_used` | varchar(50) | Использованная модель AI |
| `status` | varchar(20) | draft/generating/ready/deploying/deployed/error |
| `error_message` | text | Сообщение об ошибке |
| `deployed_url` | text | URL задеплоенного приложения |
| `deploy_platform` | varchar(50) | Платформа деплоя |
| `is_public` | boolean | Публичный ли проект |
| `allow_empty` | boolean | Разрешить пустой проект |
| `current_conversation_id` | uuid → conversations | Текущая беседа |
| `created_at` | timestamptz | Дата создания |
| `updated_at` | timestamptz | Дата обновления |
| `generated_at` | timestamptz | Дата последней генерации |
| `deployed_at` | timestamptz | Дата последнего деплоя |

**Индексы:** PK(id), idx(user_id), idx(template_id), idx(status), idx(created_at DESC)

---

### `conversations` — Беседы с AI

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `project_id` | uuid → projects | Привязка к проекту |
| `user_id` | uuid → users | Пользователь |
| `title` | varchar(255) | Заголовок беседы |
| `metadata` | jsonb | Дополнительные данные |
| `created_at` | timestamptz | Дата создания |
| `updated_at` | timestamptz | Дата обновления |

---

### `messages` — Сообщения в беседах

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `conversation_id` | uuid → conversations | Беседа |
| `role` | varchar(20) | user/assistant/system |
| `content` | text | Текст сообщения |
| `tokens_used` | integer | Использовано токенов |
| `created_at` | timestamptz | Дата создания |

---

### `artifacts` — Артефакты (сгенерированный код)

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `conversation_id` | uuid → conversations | Беседа |
| `message_id` | uuid → messages | Сообщение-источник |
| `type` | varchar(50) | Тип артефакта (code, file, etc.) |
| `title` | varchar(255) | Название файла/артефакта |
| `content` | text | Содержимое |
| `language` | varchar(50) | Язык программирования |
| `version` | integer | Версия артефакта |
| `parent_artifact_id` | uuid → artifacts | Предыдущая версия |
| `created_at` | timestamptz | Дата создания |

---

### `deployments` — История деплоев

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `project_id` | uuid → projects | Проект |
| `platform` | varchar(50) | Платформа деплоя |
| `external_id` | varchar(255) | ID контейнера на платформе |
| `status` | varchar(20) | pending/building/deployed/failed |
| `url` | text | URL задеплоенного приложения |
| `build_url` | text | URL билд-логов |
| `admin_url` | text | URL для управления |
| `logs` | text | Логи деплоя |
| `error_message` | text | Сообщение об ошибке |
| `platform_data` | json | Дополнительные данные платформы |
| `custom_domain` | text | Кастомный домен |
| `worker_ip` | varchar(50) | IP воркера деплоя |
| `last_health_check` | timestamptz | Последняя проверка здоровья |
| `created_at` | timestamptz | Дата создания деплоя |
| `updated_at` | timestamptz | Дата обновления |
| `deployed_at` | timestamptz | Дата успешного деплоя |

---

### `credit_transactions` — История транзакций кредитов

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `user_id` | uuid → users | Пользователь |
| `amount` | integer | Сумма (+ пополнение, - списание) |
| `balance_after` | integer | Баланс после транзакции |
| `transaction_type` | varchar(20) | ai_usage/purchase/daily_bonus/referral/signup/rollover |
| `description` | varchar(255) | Описание транзакции |
| `project_id` | uuid | Связанный проект (опционально) |
| `related_user_id` | uuid → users | Связанный пользователь (реферал) |
| `extra_data` | json | Дополнительные данные |
| `token_metadata` | json | Данные о токенах AI |
| `created_at` | timestamptz | Дата транзакции |

`token_metadata` формат:
```json
{
  "input_tokens": 15000,
  "output_tokens": 500,
  "cache_read_tokens": 12000,
  "cache_creation_tokens": 0,
  "model": "haiku"
}
```

---

### `payments` — Платежи

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `user_id` | uuid → users | Пользователь |
| `amount` | float | Сумма платежа |
| `currency` | varchar(3) | Валюта (RUB/USD) |
| `status` | varchar(20) | pending/succeeded/failed/canceled |
| `plan` | varchar(20) | Тариф (starter/pro/business) |
| `provider` | varchar(20) | yookassa/stripe/nowpayments |
| `yookassa_id` | varchar(255) | ID платежа в YooKassa |
| `stripe_payment_intent_id` | varchar(255) | Stripe PaymentIntent ID |
| `stripe_subscription_id` | varchar(255) | Stripe Subscription ID |
| `stripe_customer_id` | varchar(255) | Stripe Customer ID |
| `extra_data` | json | Дополнительные данные |
| `created_at` | timestamptz | Дата создания |
| `updated_at` | timestamptz | Дата обновления |

---

### `templates` — Шаблоны приложений

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `name` | varchar(255) | Название шаблона |
| `slug` | varchar(255) | URL-slug (уникальный) |
| `description` | text | Описание |
| `category` | varchar(50) | Категория (telegram_bot, web_app, api, etc.) |
| `credit_cost` | integer | Стоимость в кредитах |
| `config_schema` | json | JSON Schema для конфигурации |
| `code_template` | json | Шаблон кода |
| `prompt_template` | text | Промпт для AI |
| `onboarding_prompt` | text | Онбординговый промпт |
| `preview_image_url` | text | URL изображения превью |
| `features` | text[] | Список фич |
| `tags` | text[] | Теги |
| `usage_count` | integer | Количество использований |
| `is_active` | boolean | Активен ли шаблон |
| `sort_order` | integer | Порядок сортировки |
| `created_at` | timestamptz | Дата создания |
| `updated_at` | timestamptz | Дата обновления |

---

### `daily_bonuses` — Ежедневные бонусы

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `user_id` | uuid → users | Пользователь |
| `claimed_at` | timestamptz | Дата получения бонуса |
| `amount` | integer | Размер бонуса |

---

### `deploy_nodes` — Серверы для деплоя

| Колонка | Тип | Описание |
|---------|-----|---------|
| `id` | uuid | Первичный ключ |
| `hetzner_server_id` | bigint | ID сервера в Hetzner Cloud |
| `name` | varchar(100) | Имя сервера |
| `ip` | varchar(50) | IP адрес |
| `status` | varchar(20) | provisioning/active/full/offline |
| `deploy_count` | integer | Текущее количество деплоев |
| `max_deploys` | integer | Максимальное количество (по умолчанию 20) |
| `created_at` | timestamptz | Дата добавления |
| `updated_at` | timestamptz | Дата обновления |

---

### `oauth_accounts` — OAuth аккаунты

Таблица для хранения OAuth токенов провайдеров.

---

### `email_logs` — Лог отправленных email

Таблица для хранения истории отправленных писем.

---

## Диаграмма связей

```
users (1) ──── (N) projects
users (1) ──── (N) conversations
users (1) ──── (N) credit_transactions
users (1) ──── (N) payments
users (1) ──── (N) daily_bonuses
users (N) ─referred_by─ (1) users

projects (1) ──── (N) conversations
projects (1) ──── (N) deployments
projects (N) ──── (1) templates

conversations (1) ──── (N) messages
conversations (1) ──── (N) artifacts
messages (1) ──── (N) artifacts
artifacts (1) ──── (0..1) artifacts [parent_artifact_id]
```

---

## Полезные запросы

```sql
-- Статистика пользователей по планам
SELECT plan, COUNT(*) FROM users GROUP BY plan;

-- Топ по кредитам
SELECT email, plan, credits FROM users ORDER BY credits DESC LIMIT 10;

-- Деплои по статусам
SELECT status, COUNT(*) FROM deployments GROUP BY status;

-- Последние платежи
SELECT u.email, p.amount, p.currency, p.status, p.provider, p.created_at
FROM payments p JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC LIMIT 20;

-- Расход кредитов за 24 часа
SELECT SUM(ABS(amount)) as spent
FROM credit_transactions
WHERE transaction_type = 'ai_usage'
  AND created_at > NOW() - INTERVAL '24 hours';
```
