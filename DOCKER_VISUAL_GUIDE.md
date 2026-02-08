# 🎨 Docker Setup - Визуальный гайд

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                         │
│                     viably-network                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │   Backend    │     │
│  │     :5432    │  │    :6379     │  │    :8000     │     │
│  │              │  │              │  │   FastAPI    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                  ┌────────┴────────┐                       │
│                  │                 │                       │
│          ┌───────▼─────┐   ┌──────▼──────┐                │
│          │   Worker    │   │  Frontend   │                │
│          │   Celery    │   │   Next.js   │                │
│          │             │   │    :3000    │                │
│          └─────────────┘   └──────┬──────┘                │
│                                   │                        │
└───────────────────────────────────┼────────────────────────┘
                                    │
                            ┌───────▼────────┐
                            │   Browser      │
                            │ localhost:3000 │
                            └────────────────┘
```

## 🔄 Workflow

### 1️⃣ Первый запуск

```
./start.sh
    │
    ├─> Проверка Docker ✓
    │
    ├─> Создание .env файлов ✓
    │
    ├─> docker compose up --build
    │       │
    │       ├─> 🗄️  PostgreSQL (5432) [healthy]
    │       │
    │       ├─> 🔴 Redis (6379) [healthy]
    │       │
    │       ├─> 🐍 Backend (8000) ⏳ ждет postgres+redis
    │       │       │
    │       │       └─> [ready] ✅
    │       │
    │       ├─> 👷 Worker ⏳ ждет postgres+redis
    │       │       │
    │       │       └─> [ready] ✅
    │       │
    │       └─> ⚛️  Frontend (3000) ⏳ ждет backend
    │               │
    │               └─> [ready] ✅
    │
    └─> ✅ Готово!
        http://localhost:3000
```

### 2️⃣ Разработка (Hot Reload)

```
Вы:
    │
    ├─> Редактируете backend/app/main.py
    │       │
    │       └─> Backend контейнер
    │               │
    │               ├─> Обнаруживает изменение
    │               ├─> Перезапускает uvicorn
    │               └─> ✅ Готово за 1-2 сек
    │
    └─> Редактируете frontend/app/page.tsx
            │
            └─> Frontend контейнер
                    │
                    ├─> Webpack HMR обнаруживает
                    ├─> Компилирует модуль
                    └─> ✅ Браузер обновляется
```

### 3️⃣ Запрос к API

```
Browser
    │
    ├─> GET http://localhost:3000/dashboard
    │       │
    │       └─> Frontend Container :3000
    │               │
    │               ├─> Next.js рендерит страницу
    │               │
    │               └─> API запрос: http://localhost:8000/api/user/me
    │                       │
    │                       └─> Backend Container :8000
    │                               │
    │                               ├─> FastAPI обрабатывает
    │                               │
    │                               └─> Query: SELECT * FROM users
    │                                       │
    │                                       └─> PostgreSQL :5432
    │                                               │
    │                                               └─> Returns data
    │
    └─> ✅ Страница отображается
```

### 4️⃣ AI Генерация (Async)

```
User в UI
    │
    ├─> Нажимает "Generate"
    │       │
    │       └─> POST /api/generate
    │               │
    │               └─> Backend :8000
    │                       │
    │                       ├─> Создает Job в БД
    │                       │
    │                       └─> Отправляет task в Redis
    │                               │
    │                               └─> Celery Worker получает
    │                                       │
    │                                       ├─> Вызывает Claude API
    │                                       │
    │                                       ├─> Обновляет статус в БД
    │                                       │
    │                                       └─> ✅ Готово
    │
    └─> WebSocket уведомление -> Frontend обновляется
```

## 📦 Volumes & Persistence

```
Docker Host
    │
    ├─> /var/lib/docker/volumes/
    │       │
    │       ├─> viably_postgres_data/
    │       │   └─> /var/lib/postgresql/data
    │       │       ├─ users table
    │       │       ├─ projects table
    │       │       └─ ... (persistent)
    │       │
    │       └─> viably_redis_data/
    │           └─> /data
    │               └─ celery tasks (persistent)
    │
    └─> docker compose down
            │
            ├─> Останавливает контейнеры
            ├─> Удаляет контейнеры
            └─> Volumes остаются! ✅

docker compose down -v
    │
    └─> ⚠️  Удаляет volumes (все данные потеряны!)
```

## 🔀 Networking

```
viably-network (bridge)
    │
    ├─> postgres:5432
    │   └─ Внутри: postgres:5432
    │   └─ Снаружи: localhost:5432
    │
    ├─> redis:6379
    │   └─ Внутри: redis:6379
    │   └─ Снаружи: localhost:6379
    │
    ├─> backend:8000
    │   └─ Внутри: backend:8000
    │   └─ Снаружи: localhost:8000
    │
    ├─> worker
    │   └─ Только внутри сети
    │
    └─> frontend:3000
        └─ Внутри: frontend:3000
        └─ Снаружи: localhost:3000

Правило:
- Из контейнера → используй имя сервиса (postgres, redis)
- Из браузера → используй localhost
```

## 🛠️ Build Process

### Backend

```
Dockerfile (multi-stage)
    │
    ├─> Stage 1: builder
    │   ├─ FROM python:3.12-slim
    │   ├─ Устанавливает Poetry
    │   ├─ Копирует pyproject.toml
    │   ├─ poetry install
    │   └─ ✅ /usr/local/lib/python3.12/site-packages
    │
    └─> Stage 2: runtime
        ├─ FROM python:3.12-slim
        ├─ Копирует зависимости из builder
        ├─ Копирует код приложения
        └─ CMD uvicorn --reload

Результат: Slim образ (~150MB вместо ~800MB)
```

### Frontend

```
Dockerfile (multi-stage, 4 targets)
    │
    ├─> Stage 1: base
    │   └─ FROM node:18-alpine
    │
    ├─> Stage 2: deps
    │   ├─ Копирует package.json
    │   └─ npm ci
    │
    ├─> Stage 3: dev ✅ (используется в docker-compose)
    │   ├─ Копирует node_modules из deps
    │   ├─ Копирует исходный код
    │   └─ CMD npm run dev
    │
    ├─> Stage 4: builder (для production)
    │   └─ npm run build
    │
    └─> Stage 5: runner (для production)
        └─ CMD node server.js

docker-compose.yml указывает: target: dev
```

## 🔧 Environment Variables Flow

```
.env файлы
    │
    ├─> backend/.env
    │   ├─ DATABASE_URL=postgresql://...@postgres:5432/viably
    │   ├─ CELERY_BROKER_URL=redis://redis:6379/0
    │   └─ JWT_SECRET_KEY=xxx
    │       │
    │       └─> docker-compose.yml
    │               │
    │               ├─> backend service
    │               │   └─ env_file: ./backend/.env
    │               │
    │               └─> worker service
    │                   └─ env_file: ./backend/.env
    │
    └─> frontend/.env.local
        ├─ NEXT_PUBLIC_API_URL=http://localhost:8000
        └─ NEXT_PUBLIC_WS_URL=ws://localhost:8000
            │
            └─> docker-compose.yml
                    │
                    └─> frontend service
                        └─ env_file: ./frontend/.env.local

Важно:
- Backend/Worker используют имена сервисов (postgres, redis)
- Frontend использует localhost (запросы из браузера)
```

## 📊 Resource Usage

```
Сервис          CPU      Memory    Disk
─────────────────────────────────────────
PostgreSQL      5%       50MB      100MB
Redis           2%       20MB      10MB
Backend         10%      100MB     -
Worker          5%       80MB      -
Frontend        15%      200MB     -
─────────────────────────────────────────
ИТОГО           ~37%     ~450MB    ~110MB
```

## 🎯 Command Cheat Sheet

```
┌─────────────────────┬─────────────────────────────────┐
│ Задача              │ Команда                         │
├─────────────────────┼─────────────────────────────────┤
│ Запустить всё       │ ./start.sh                      │
│ Остановить всё      │ ./stop.sh                       │
│ Логи всех сервисов  │ docker compose logs -f          │
│ Логи backend        │ docker compose logs -f backend  │
│ Статус              │ docker compose ps               │
│ Перезапуск          │ docker compose restart          │
│ Пересборка          │ docker compose up --build       │
│ Shell backend       │ docker compose exec backend bash│
│ Shell БД            │ docker compose exec postgres \ │
│                     │   psql -U postgres -d viably    │
│ Миграции            │ make migrate                    │
│ Тесты backend       │ make test-backend               │
│ Полная очистка      │ docker compose down -v          │
└─────────────────────┴─────────────────────────────────┘
```

## 🚨 Troubleshooting Flowchart

```
Проблема?
    │
    ├─> Сервис не стартует
    │       │
    │       ├─> docker compose ps
    │       │       │
    │       │       └─> Status: Exited/Restarting
    │       │               │
    │       │               └─> docker compose logs <service>
    │       │                       │
    │       │                       └─> Читаем ошибку
    │       │
    │       └─> Порт занят?
    │               │
    │               └─> lsof -i :3000
    │                       │
    │                       └─> kill -9 <PID>
    │
    ├─> Изменения не применяются
    │       │
    │       └─> docker compose restart <service>
    │
    ├─> БД не подключается
    │       │
    │       ├─> Проверь DATABASE_URL
    │       │   └─ Должно быть @postgres:5432 (не localhost!)
    │       │
    │       └─> docker compose logs postgres
    │
    └─> Всё сломалось
            │
            └─> docker compose down -v
                docker compose up --build
                    │
                    └─> ✅ Чистый старт
```

---

**Визуальные гайды помогают быстрее понять архитектуру!** 🎨

См. также:
- [QUICKSTART.md](QUICKSTART.md) - текстовые инструкции
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - детальная документация
