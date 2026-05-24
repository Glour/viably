# 🐳 Сервисы Viably

Описание каждого Docker-сервиса в `docker-compose.yml`.

---

## Профили запуска

Viably использует Docker Compose profiles:
- `dev` — разработка (hot reload, volume mount кода)
- `prod` — продакшн (собранный образ, без mount)

Профиль определяется автоматически по git ветке (Makefile):
- `develop/*`, `dev` → profile `dev`
- `main`, `master`, `release/*` → profile `prod`

---

## backend-prod / backend-dev

**Роль:** Основной API сервер (FastAPI)

| Параметр | Значение |
|----------|---------|
| Образ | Собирается из `./backend/Dockerfile` |
| Порт | `8000:8000` |
| Лимит CPU | 1.0 CPU (prod), 1.0 CPU (dev) |
| Лимит RAM | 512 MB (prod), 400 MB (dev) |
| Имя контейнера | `viably-backend` |
| Команда (dev) | `uvicorn api.src.main:app --host 0.0.0.0 --port 8000 --reload` |

**Зависимости:** postgres (healthy), redis (healthy)

**Volumes:**
- `/var/run/docker.sock` — для управления Docker контейнерами деплоя
- `/opt/viably-deploys` — директория деплоев
- `/opt/viably-sites` — данные задеплоенных сайтов
- `/etc/nginx/sites-enabled` — конфиги nginx для поддоменов
- `./backend:/app` (только dev) — hot reload кода

**Env файл:** `./backend/.env`

**Переменные окружения:**
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/viably
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

---

## frontend-prod / frontend-dev

**Роль:** Web приложение (Next.js 14)

| Параметр | Значение |
|----------|---------|
| Образ | Собирается из `./frontend/Dockerfile` (target: runner) |
| Порт | `3000:3000` |
| Лимит CPU | 0.7 CPU (prod), 1.0 CPU (dev) |
| Лимит RAM | 1 GB (prod), 1 GB (dev) |
| Имя контейнера | `viably-frontend` |

**Зависимости:** backend-prod/dev

**Healthcheck:** `wget -q -O /dev/null http://127.0.0.1:3000`

**Env файл:** `./frontend/.env.local`

**Переменные окружения:**
```
NEXT_TELEMETRY_DISABLED=1
INTERNAL_API_URL=http://backend-dev:8000  # только dev
```

---

## worker-prod / worker-dev

**Роль:** Celery воркер для фоновых задач

| Параметр | Значение |
|----------|---------|
| Образ | Собирается из `./backend/Dockerfile.worker` |
| Лимит CPU | 1.0 CPU |
| Лимит RAM | 512 MB (prod), 400 MB (dev) |
| Имя контейнера | `viably-worker` |

**Зависимости:** postgres (healthy), redis (healthy)

**Задачи воркера:**
- Деплой проектов (Docker контейнеры)
- Отправка email уведомлений
- Фоновая обработка платежей

**Volumes:**
- `/var/run/docker.sock` — для Docker операций
- `/opt/viably-deploys`, `/opt/viably-sites`, `/etc/nginx/sites-enabled`
- `./backend:/app` (только dev) — hot reload

---

## postgres

**Роль:** Основная база данных

| Параметр | Значение |
|----------|---------|
| Образ | `postgres:16-alpine` |
| Порт | `127.0.0.1:5432:5432` (только localhost!) |
| Лимит RAM | 256 MB |
| Имя контейнера | `viably-postgres` |
| Volume | `postgres_data:/var/lib/postgresql/data` |

**Переменные:**
```
POSTGRES_DB=viably
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres  # из env или .env
```

**Healthcheck:** кастомный скрипт `/healthcheck.sh`

**Init скрипт:** `./docker/postgres/init.sh` (создание расширений, начальных данных)

---

## redis

**Роль:** Брокер Celery + кеш + rate limiter

| Параметр | Значение |
|----------|---------|
| Образ | `redis:7-alpine` |
| Порт | `127.0.0.1:6379:6379` (только localhost!) |
| Лимит RAM | 64 MB |
| Имя контейнера | `viably-redis` |
| Volume | `redis_data:/data` |

**Использование:**
- Celery broker (очередь задач): `redis://redis:6379/0`
- Celery result backend
- FastAPI rate limiter (prefix: `ratelimit`)

**Healthcheck:** `redis-cli ping`

---

## dozzle

**Роль:** Web UI для просмотра логов контейнеров

| Параметр | Значение |
|----------|---------|
| Образ | `amir20/dozzle:latest` |
| Порт | `9999:8080` |
| Лимит RAM | 128 MB |
| Имя контейнера | `viably-dozzle` |
| URL | http://server:9999 |

**Конфигурация:**
```
DOZZLE_LEVEL=info
DOZZLE_TAILSIZE=300
DOZZLE_FILTER=name=viably-*   # показывает только viably контейнеры
```

Отображает логи всех контейнеров с именем `viably-*` в удобном веб-интерфейсе.

---

## viably-proxy

**Роль:** Anthropic OAT (OAuth-with-App-Token) прокси

**Расположение:** `./viably-proxy/`

**Назначение:**
- Проксирует запросы к Anthropic Claude API
- Rate limiting на уровне прокси
- Key rotation / управление токенами
- Изоляция API ключей от кода

**Запуск:** отдельный docker-compose в `./viably-proxy/docker-compose.yml`

Бэкенд обращается к Anthropic через прокси по адресу `http://viably-proxy:8080`.

---

## Deployed контейнеры (пользовательские боты/приложения)

Это не часть docker-compose.yml, но важная часть системы:

- Каждый задеплоенный проект запускается как отдельный Docker контейнер
- Имя: `viably-deploy-{project_id}`
- Подключается к `viably-network`
- Nginx на хосте создаёт конфиг для поддомена: `{slug}.viably.io`
- Ресурсы: 0.25 vCPU, 256 MB RAM (на контейнер)
- Максимум на сервере: ~20-30 контейнеров

Reconnect после рестарта: `make reconnect-bots`
