# 🏗️ Архитектура Viably

## Обзор системы

Viably — AI-powered платформа для вайб-кодинга. Пользователь описывает приложение в чате, AI генерирует код, пользователь видит результат в preview и одним кликом деплоит на реальный сервер.

---

## Схема сервисов

```
                        INTERNET
                            |
              ┌─────────────▼──────────────┐
              │        Nginx / SSL          │
              │   viably.io (HTTPS/WSS)     │
              └──────┬─────────────┬────────┘
                     │             │
          ┌──────────▼──┐    ┌─────▼──────────┐
          │  Next.js    │    │   FastAPI       │
          │  frontend   │    │   backend       │
          │  :3000      │    │   :8000         │
          └─────────────┘    └──┬──────────┬───┘
                                │          │
              ┌─────────────────▼─┐   ┌────▼────────────┐
              │   PostgreSQL      │   │     Redis        │
              │   :5432           │   │     :6379        │
              └───────────────────┘   └─────────┬────────┘
                                                │
                                    ┌───────────▼────────┐
                                    │   Celery Worker    │
                                    │   (async tasks)    │
                                    └────────────────────┘

   viably-proxy (:8080) — Anthropic OAT Proxy
   Dozzle (:9999)       — Log UI (viably-* containers)

   Deployed bots/apps (отдельные Docker контейнеры):
   viably-deploy-{project_id}   (:dynamic_port)
   → nginx subdomain: {slug}.viably.io
```

---

## Флоу вайб-кодинга

```
Пользователь → выбирает шаблон → создаётся Project + Conversation

Пользователь → пишет запрос (WebSocket)
  → backend классифицирует (SIMPLE/STANDARD/FULL)
  → выбирается модель (Haiku vs Sonnet)
  → формируется промпт (BASE → +CATEGORY → +TEMPLATE)
  → AI стримит ответ → stream SSE/WS к пользователю
  → Message + Artifact сохраняются в БД
  → POST-PAY: списываются кредиты
  → credits_used event клиенту

Пользователь → нажимает Deploy
  → проверяется лимит деплоев по плану
  → создаётся Deployment запись
  → Celery task: docker run + nginx config + domain
  → deployed_url возвращается клиенту
```

---

## Backend модули

### `api/src/auth/` — Аутентификация
- Регистрация / логин по email + пароль
- JWT access/refresh токены
- OAuth: Google, GitHub

### `api/src/users/` — Пользователи
- CRUD профиля
- Реферальная система (уникальный код, +5 кредитов за приглашённого)

### `api/src/projects/` — Проекты
- Создание/редактирование/удаление проектов
- Привязка к шаблону и текущей беседе
- Статусы: draft → generating → ready → deploying → deployed → error

### `api/src/conversations/` — Беседы и AI
- WebSocket endpoint для real-time чата
- История сообщений (messages)
- Артефакты (сгенерированный код, файлы)

### `api/src/ai/` — AI сервис
- Классификатор запросов: SIMPLE / STANDARD / FULL
- Smart routing: Haiku для простых, Sonnet для сложных
- Тиерная система промптов
- Prompt caching (экономия 90% на input tokens)

### `api/src/credits/` — Кредитная система
- Динамическое ценообразование: `ceil((input + output×3) / 10000)`
- Post-pay биллинг (списание после генерации)
- Daily bonus (claim раз в день)
- Monthly rollover cron
- История транзакций

### `api/src/payments/` — Платежи
- YooKassa (Россия, RUB)
- Stripe (глобально, USD)
- NOWPayments (крипта)
- Webhook обработка

### `api/src/deploy/` — Деплой
- Проверка лимитов деплоев по плану
- Запуск Docker контейнеров на VPS (через docker.sock)
- Управление nginx конфигурацией
- Автоматические поддомены
- `deploy_nodes` — пул серверов для деплоя

### `api/src/templates/` — Шаблоны
- Галерея готовых шаблонов (Telegram боты, API сервисы)

### `api/src/github/` — GitHub интеграция
- OAuth авторизация через GitHub
- Push кода в репозиторий

### `api/src/admin/` — Администрирование
- Управление пользователями, планами, кредитами

### `api/src/emails/` — Email сервис
- Транзакционные письма (Resend)

### `api/src/ws/` — WebSocket
- Real-time стриминг AI ответов
- События: credits_used, deployment_status

---

## Frontend структура

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth layout group
│   ├── (main)/            # Main layout group
│   ├── dashboard/         # Дашборд
│   ├── projects/          # Список и редактор проектов
│   ├── templates/         # Галерея шаблонов
│   ├── credits/           # Управление кредитами
│   ├── payments/          # Страницы оплаты
│   └── pricing/           # Тарифы
├── features/              # Feature-based модули
│   ├── auth/              # Авторизация
│   ├── generation/        # AI генерация (чат + preview)
│   ├── projects/          # Управление проектами
│   └── subscription/      # Подписка
├── entities/              # Shared entity типы
├── shared/                # Переиспользуемые компоненты
└── widgets/               # Комплексные виджеты
```

**Tech stack:**
- Next.js 14 (App Router), TypeScript
- shadcn/ui (Radix UI + Tailwind CSS)
- TanStack Query (server state), Zustand (client state)
- WebSocket client (AI чат)

---

## База данных

PostgreSQL 16, 14 таблиц. Полная схема: [DATABASE.md](DATABASE.md)

```
users
  ├── projects
  │     ├── conversations
  │     │     ├── messages → artifacts
  │     │     └── (current_conversation в projects)
  │     └── deployments
  ├── credit_transactions
  ├── payments
  ├── daily_bonuses
  ├── email_logs
  └── oauth_accounts
templates
deploy_nodes
```

---

## Инфраструктура

- **Сервер:** Hetzner Cloud VPS (ARM64, Ubuntu)
- **Prod:** CX42 (8 vCPU, 16 GB RAM, ~$10/мес)
- **Dev:** CX32 (4 vCPU, 8 GB RAM, ~$6/мес)
- **Container runtime:** Docker + Docker Compose
- **Reverse proxy:** Nginx (на хосте)
- **SSL:** Certbot / Let's Encrypt
- **Monitoring:** Sentry (ошибки), Dozzle (логи)

---

## Docker сеть

Все сервисы в `viably-network` (bridge):

| Сервис | Внутренний хост | Внешний порт |
|--------|----------------|--------------|
| backend | viably-backend:8000 | 8000 |
| frontend | viably-frontend:3000 | 3000 |
| postgres | viably-postgres:5432 | 127.0.0.1:5432 |
| redis | viably-redis:6379 | 127.0.0.1:6379 |
| dozzle | viably-dozzle:8080 | 9999 |

Deployed боты подключаются к `viably-network` автоматически.
