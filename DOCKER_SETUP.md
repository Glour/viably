# 🐳 Docker Setup - Viably Local Development

## 📋 Предварительные требования

Убедитесь, что у вас установлены:

- **Docker** (версия 20.10+)
- **Docker Compose** (версия 2.0+)

Проверить установку:
```bash
docker --version
docker compose version
```

## 🚀 Быстрый старт

### 1. Клонируйте репозиторий (если еще не сделали)
```bash
git clone <repository-url>
cd viably
```

### 2. Проверьте .env файлы

**Backend** (`backend/.env`) - уже настроен ✅
- DATABASE_URL: `postgresql+asyncpg://postgres:postgres@postgres:5432/viably`
- JWT_SECRET_KEY: установлен безопасный ключ
- CELERY_BROKER_URL: `redis://redis:6379/0`

**Frontend** (`frontend/.env.local`) - проверьте:
```bash
cat frontend/.env.local
```

Должно быть:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

### 3. Запустите все сервисы

```bash
# Из корневой директории проекта
docker compose up --build
```

**Что произойдет:**
1. 🗄️  PostgreSQL запустится на `localhost:5432`
2. 🔴 Redis запустится на `localhost:6379`
3. 🐍 Backend (FastAPI) запустится на `http://localhost:8000`
4. 👷 Celery Worker запустится для AI-генерации
5. ⚛️  Frontend (Next.js) запустится на `http://localhost:3000`

### 4. Проверьте, что все работает

Откройте в браузере:
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

## 📦 Сервисы и порты

| Сервис         | Порт  | URL                          | Описание                     |
|----------------|-------|------------------------------|------------------------------|
| Frontend       | 3000  | http://localhost:3000        | Next.js приложение           |
| Backend API    | 8000  | http://localhost:8000        | FastAPI REST API             |
| PostgreSQL     | 5432  | localhost:5432               | База данных                  |
| Redis          | 6379  | localhost:6379               | Очередь задач                |
| Celery Worker  | -     | -                            | AI-генерация в фоне          |

## 🛠️ Полезные команды

### Запуск/остановка

```bash
# Запуск в фоновом режиме
docker compose up -d

# Остановка всех сервисов
docker compose down

# Остановка и удаление volumes (ОСТОРОЖНО: удалит БД)
docker compose down -v

# Перезапуск конкретного сервиса
docker compose restart backend
docker compose restart frontend
```

### Логи

```bash
# Все логи
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f worker

# Последние 100 строк
docker compose logs --tail=100 backend
```

### Выполнение команд внутри контейнеров

```bash
# Backend - запуск миграций
docker compose exec backend alembic upgrade head

# Backend - создание миграции
docker compose exec backend alembic revision --autogenerate -m "migration_name"

# Backend - Python shell
docker compose exec backend python

# Frontend - установка зависимостей
docker compose exec frontend npm install <package-name>

# PostgreSQL - подключение к БД
docker compose exec postgres psql -U postgres -d viably
```

### Пересборка образов

```bash
# Пересобрать все образы
docker compose build

# Пересобрать конкретный сервис
docker compose build backend
docker compose build frontend

# Пересобрать без кэша
docker compose build --no-cache
```

### Очистка

```bash
# Удалить остановленные контейнеры
docker compose rm

# Очистить все Docker ресурсы (осторожно!)
docker system prune -a

# Очистить только volumes
docker volume prune
```

## 🐛 Troubleshooting

### Проблема: Порт уже занят

**Ошибка**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Решение**:
```bash
# Найти процесс на порту 3000
lsof -i :3000
# или
netstat -tulpn | grep :3000

# Убить процесс
kill -9 <PID>

# Или изменить порт в docker-compose.yml:
# frontend:
#   ports:
#     - "3001:3000"  # внешний:внутренний
```

### Проблема: Backend не подключается к БД

**Ошибка**: `could not connect to server: Connection refused`

**Решение**:
1. Проверьте, что PostgreSQL запущен:
   ```bash
   docker compose ps postgres
   ```

2. Проверьте логи:
   ```bash
   docker compose logs postgres
   ```

3. Проверьте DATABASE_URL в `backend/.env`:
   ```
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/viably
   ```
   **Важно**: используйте `postgres` (имя сервиса), не `localhost`!

### Проблема: Frontend не видит Backend

**Ошибка**: `Failed to fetch` или `ERR_CONNECTION_REFUSED`

**Решение**:
1. Проверьте, что backend запущен:
   ```bash
   curl http://localhost:8000/health
   ```

2. Проверьте `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Проверьте CORS в `backend/.env`:
   ```env
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

### Проблема: Celery Worker не подключается к Redis

**Ошибка**: `Error 111 connecting to redis:6379. Connection refused`

**Решение**:
1. Проверьте Redis:
   ```bash
   docker compose ps redis
   docker compose logs redis
   ```

2. Проверьте `backend/.env`:
   ```env
   CELERY_BROKER_URL=redis://redis:6379/0
   CELERY_RESULT_BACKEND=redis://redis:6379/0
   ```

### Проблема: Изменения в коде не применяются

**Решение**:
```bash
# Для backend (Python)
docker compose restart backend

# Для frontend (Next.js) - обычно hot-reload работает
# Если не работает:
docker compose restart frontend

# Или пересоберите образ:
docker compose up --build backend
```

### Проблема: Нет места на диске

**Ошибка**: `no space left on device`

**Решение**:
```bash
# Очистить неиспользуемые образы
docker image prune -a

# Очистить неиспользуемые volumes
docker volume prune

# Очистить всё неиспользуемое
docker system prune -a --volumes
```

## 🔧 Настройка для разработки

### Hot Reload

**Backend**: FastAPI автоматически перезагружается при изменении кода (флаг `--reload`)

**Frontend**: Next.js автоматически перезагружается (режим development)

### Volumes

Код монтируется как volume, изменения применяются сразу:
- Backend: `./backend:/app`
- Frontend: `./frontend:/app`

### Переменные окружения

Вы можете передавать переменные через `.env` файлы или напрямую в `docker-compose.yml`:

```yaml
environment:
  - DEBUG=True
  - LOG_LEVEL=DEBUG
```

## 📝 Миграции БД

### Создание миграции

```bash
# 1. Измените модели в backend/app/*/models.py

# 2. Создайте миграцию
docker compose exec backend alembic revision --autogenerate -m "add_new_table"

# 3. Примените миграцию
docker compose exec backend alembic upgrade head
```

### Откат миграции

```bash
# Откатить последнюю миграцию
docker compose exec backend alembic downgrade -1

# Откатить к конкретной версии
docker compose exec backend alembic downgrade <revision_id>
```

## 🧪 Тестирование

```bash
# Backend тесты
docker compose exec backend pytest

# Backend с покрытием
docker compose exec backend pytest --cov=app

# Frontend тесты (unit)
docker compose exec frontend npm test

# Frontend E2E (Playwright)
docker compose exec frontend npm run test:e2e
```

## 🔐 Безопасность

**Для production:**

1. Измените `JWT_SECRET_KEY` в `backend/.env`
2. Используйте сильные пароли для PostgreSQL
3. Не коммитьте `.env` файлы в git
4. Используйте Docker secrets или environment variables для production

## 📚 Дополнительные ресурсы

- [Docker Compose документация](https://docs.docker.com/compose/)
- [FastAPI документация](https://fastapi.tiangolo.com/)
- [Next.js документация](https://nextjs.org/docs)
- [PostgreSQL документация](https://www.postgresql.org/docs/)

## 🆘 Нужна помощь?

Если что-то не работает:

1. Проверьте логи: `docker compose logs -f`
2. Проверьте статус: `docker compose ps`
3. Перезапустите: `docker compose restart`
4. Пересоберите: `docker compose up --build`
5. Очистите и начните заново: `docker compose down -v && docker compose up --build`

---

**Готово! Теперь вы можете разрабатывать Viably локально! 🎉**
