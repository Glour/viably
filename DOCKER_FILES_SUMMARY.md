# 📦 Docker Files Summary

Полный список файлов для Docker-запуска проекта.

## 📁 Структура файлов

```
viably/
├── docker-compose.yml          # Главный файл оркестрации
├── .env.docker.example         # Пример переменных для docker-compose
│
├── backend/
│   ├── Dockerfile              # Backend API образ
│   ├── Dockerfile.worker       # Celery Worker образ
│   ├── .dockerignore          # Исключения для backend
│   ├── .env.example           # Пример переменных backend
│   └── .env                   # Реальные переменные (не коммитится)
│
├── frontend/
│   ├── Dockerfile             # Frontend образ (multi-stage)
│   ├── .dockerignore         # Исключения для frontend
│   ├── .env.example          # Пример переменных frontend
│   └── .env.local            # Реальные переменные (не коммитится)
│
├── start.sh                   # Скрипт быстрого запуска
├── stop.sh                    # Скрипт остановки
├── Makefile                   # Make команды
│
└── Документация:
    ├── QUICKSTART.md          # Быстрый старт
    ├── DOCKER_SETUP.md        # Полная документация
    ├── DOCKER_CHECKLIST.md    # Чеклист проверки
    └── DOCKER_FILES_SUMMARY.md # Этот файл
```

## 🐳 docker-compose.yml

**Назначение**: Оркестрация всех сервисов

**Сервисы**:
1. `postgres` - PostgreSQL 16 база данных
2. `redis` - Redis 7 для очередей
3. `backend` - FastAPI приложение
4. `worker` - Celery Worker для AI-генерации
5. `frontend` - Next.js приложение

**Volumes**:
- `postgres_data` - данные PostgreSQL (persistent)
- `redis_data` - данные Redis (persistent)

**Network**:
- `viably-network` - bridge сеть для всех сервисов

## 🐍 backend/Dockerfile

**Назначение**: Сборка FastAPI приложения

**Особенности**:
- Multi-stage build (builder + runtime)
- Poetry для зависимостей
- Python 3.12-slim базовый образ
- Hot reload в dev режиме (`--reload`)

**Команда**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 👷 backend/Dockerfile.worker

**Назначение**: Сборка Celery Worker

**Особенности**:
- Идентичный backend/Dockerfile (базовый образ)
- Отдельная команда для Celery

**Команда**:
```bash
celery -A app.ai.worker worker --loglevel=info
```

## ⚛️ frontend/Dockerfile

**Назначение**: Сборка Next.js приложения

**Targets**:
1. `deps` - установка зависимостей
2. `dev` - development режим (используется в docker-compose)
3. `builder` - production build
4. `runner` - production runtime

**Команда (dev)**:
```bash
npm run dev
```

## 🔧 Файлы конфигурации

### backend/.env

**Обязательные переменные**:
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/viably
JWT_SECRET_KEY=<generated-secret>
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

**Важно**: Используйте `postgres` и `redis` как хосты (имена сервисов в docker-compose), не `localhost`!

### frontend/.env.local

**Переменные**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

**Важно**: Используйте `localhost` для URL (т.к. браузер делает запросы с хост-машины)!

## 🚀 Скрипты запуска

### start.sh

**Назначение**: Быстрый запуск всего проекта

**Что делает**:
1. ✅ Проверяет Docker
2. ✅ Создает .env файлы из примеров
3. ✅ Запускает `docker compose up --build -d`
4. ✅ Показывает статус и URLs

**Использование**:
```bash
./start.sh
```

### stop.sh

**Назначение**: Остановка всех сервисов

**Использование**:
```bash
./stop.sh
```

## 📋 Makefile

**Назначение**: Удобные команды для разработки

**Основные команды**:
```bash
make start          # Запустить
make stop           # Остановить
make restart        # Перезапустить
make logs           # Логи всех сервисов
make logs-backend   # Логи backend
make logs-frontend  # Логи frontend
make build          # Пересобрать образы
make ps             # Статус сервисов
make clean          # Очистка (с подтверждением)
make migrate        # Миграции БД
make test-backend   # Тесты backend
make help           # Все команды
```

## 🗂️ .dockerignore

### backend/.dockerignore

Исключает:
- `__pycache__/`, `*.pyc` - Python кэш
- `.pytest_cache/` - тесты
- `.venv/`, `venv/` - виртуальное окружение
- `.git/` - git история
- `docs/`, `*.md` - документация

### frontend/.dockerignore

Исключает:
- `node_modules/` - зависимости (устанавливаются в контейнере)
- `.next/`, `build/` - артефакты сборки
- `test-results/`, `playwright-report/` - тесты
- `.git/` - git история

## 📚 Документация

### QUICKSTART.md

**Для кого**: Новые пользователи
**Содержит**: Минимальные инструкции для быстрого старта

### DOCKER_SETUP.md

**Для кого**: Разработчики
**Содержит**:
- Полная документация всех команд
- Troubleshooting
- Примеры использования
- Best practices

### DOCKER_CHECKLIST.md

**Для кого**: Проверка перед первым запуском
**Содержит**: Чеклист шагов для верификации

## 🔐 Безопасность

**Не коммитить**:
- `backend/.env`
- `frontend/.env.local`
- `.env` (корень проекта, если создан)

**Коммитить**:
- `backend/.env.example`
- `frontend/.env.example`
- `.env.docker.example`

## 🎯 Workflow

### Первый запуск

1. Клонировать репозиторий
2. Запустить `./start.sh`
3. Проверить http://localhost:3000
4. Следовать [DOCKER_CHECKLIST.md](DOCKER_CHECKLIST.md)

### Ежедневная разработка

```bash
# Утро
make start

# Разработка (код автоматически обновляется)
# ... редактируйте файлы ...

# Просмотр логов при необходимости
make logs-backend
make logs-frontend

# Вечер
make stop
```

### Изменение зависимостей

**Backend** (Python):
```bash
# 1. Добавить в pyproject.toml
# 2. Пересобрать образ
make build
docker compose restart backend
```

**Frontend** (Node.js):
```bash
# 1. Добавить через npm
docker compose exec frontend npm install <package>
# или
make build
docker compose restart frontend
```

### Миграции БД

```bash
# Создать миграцию
make migrate-create

# Применить миграции
make migrate
```

## 🐛 Troubleshooting Quick Links

- **Порт занят**: [DOCKER_SETUP.md#port-already-allocated](DOCKER_SETUP.md#проблема-порт-уже-занят)
- **БД не подключается**: [DOCKER_SETUP.md#backend-не-подключается-к-бд](DOCKER_SETUP.md#проблема-backend-не-подключается-к-бд)
- **Frontend не видит Backend**: [DOCKER_SETUP.md#frontend-не-видит-backend](DOCKER_SETUP.md#проблема-frontend-не-видит-backend)
- **Hot reload не работает**: [DOCKER_SETUP.md#изменения-не-применяются](DOCKER_SETUP.md#проблема-изменения-в-коде-не-применяются)

## 📊 Порты

| Сервис    | Внутренний | Внешний | Доступ              |
|-----------|------------|---------|---------------------|
| Frontend  | 3000       | 3000    | http://localhost:3000 |
| Backend   | 8000       | 8000    | http://localhost:8000 |
| PostgreSQL| 5432       | 5432    | localhost:5432      |
| Redis     | 6379       | 6379    | localhost:6379      |

## ✅ Готово к использованию

Вся инфраструктура настроена и готова к запуску командой:

```bash
./start.sh
```

**Следующие шаги**:
1. Запустить проект
2. Зарегистрироваться в UI
3. Добавить ANTHROPIC_API_KEY для AI
4. Начать разработку!
