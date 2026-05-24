# 📋 Runbook — Операционная документация Viably

## Быстрые команды

### Запуск / Остановка

```bash
cd /home/viably

# Запуск (auto-detect профиль по git ветке)
make start

# Запуск явно prod
make prod

# Запуск явно dev
make dev

# Остановка
make stop

# Перезапуск
make restart

# Статус контейнеров
make ps
# или
docker ps --filter "name=viably-"
```

### Логи

```bash
# Все логи (следить)
make logs

# Логи конкретного сервиса
make logs-backend
make logs-frontend
make logs-worker

# Через docker напрямую
docker logs -f viably-backend
docker logs -f viably-frontend
docker logs -f viably-worker
docker logs -f viably-postgres
docker logs -f viably-redis

# Dozzle web UI (все логи в браузере)
open http://<SERVER_IP>:9999
```

---

## Деплой новой версии

### Обновление кода и пересборка

```bash
cd /home/viably

# Получить новый код
git pull origin main

# Пересборка и рестарт
make build
make prod

# Или одной командой
git pull && make build && make prod
```

### Деплой только бэкенда

```bash
cd /home/viably
docker compose --profile prod build backend-prod
docker compose --profile prod up -d backend-prod
```

### Деплой только фронтенда

```bash
cd /home/viably
docker compose --profile prod build frontend-prod
docker compose --profile prod up -d frontend-prod
```

---

## Миграции базы данных

```bash
cd /home/viably

# Применить все миграции
make migrate

# Создать новую миграцию
make migrate-create
# → введёт имя миграции интерактивно

# Вручную через docker exec
docker exec viably-backend alembic -c alembic.ini upgrade head
docker exec viably-backend alembic -c alembic.ini current
docker exec viably-backend alembic -c alembic.ini history
```

---

## База данных — Backup / Restore

### Backup

```bash
# Создать дамп
docker exec viably-postgres pg_dump -U postgres viably > /home/viably/backup_$(date +%Y%m%d_%H%M%S).sql

# Сжатый дамп
docker exec viably-postgres pg_dump -U postgres -Fc viably > /home/viably/backup_$(date +%Y%m%d_%H%M%S).dump

# Дамп только схемы (без данных)
docker exec viably-postgres pg_dump -U postgres --schema-only viably > schema.sql
```

### Restore

```bash
# Из SQL файла
docker exec -i viably-postgres psql -U postgres -d viably < backup.sql

# Из dump файла
docker exec -i viably-postgres pg_restore -U postgres -d viably backup.dump

# Восстановление с нуля (дропнуть и пересоздать БД)
docker exec viably-postgres psql -U postgres -c "DROP DATABASE viably;"
docker exec viably-postgres psql -U postgres -c "CREATE DATABASE viably;"
docker exec -i viably-postgres psql -U postgres -d viably < backup.sql
```

### Подключение к psql

```bash
# Через make
make shell-db

# Напрямую
docker exec -it viably-postgres psql -U postgres -d viably
```

---

## Проверка здоровья системы

### Health checks

```bash
# Backend API health
curl http://localhost:8000/health

# Frontend health
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3000

# Postgres
docker exec viably-postgres pg_isready -U postgres

# Redis
docker exec viably-redis redis-cli ping

# Все сервисы
docker ps --filter "name=viably-" --format "table {{.Names}}\t{{.Status}}"
```

### Нагрузка и ресурсы

```bash
# Статистика контейнеров
docker stats --no-stream --filter "name=viably-"

# Топ процессов в контейнере
docker exec viably-backend top
docker exec viably-worker top

# Диск
df -h /opt/viably-deploys /opt/viably-sites
docker system df
```

### Проверка Redis

```bash
docker exec viably-redis redis-cli info memory
docker exec viably-redis redis-cli dbsize
docker exec viably-redis redis-cli keys "ratelimit:*" | head -20
```

---

## Управление deployed ботами

```bash
# Список запущенных деплоев
docker ps --filter "name=viably-deploy-"

# Логи конкретного деплоя
docker logs -f viably-deploy-{project_id}

# Остановить деплой
docker stop viably-deploy-{project_id}

# Переподключить ботов к сети после рестарта compose
make reconnect-bots

# Очистить stopped деплои
docker container prune --filter "name=viably-deploy-"
```

---

## Часто встречающиеся проблемы

### Backend не запускается

```bash
# Проверить логи
docker logs viably-backend --tail 50

# Проверить что postgres доступен
docker exec viably-postgres pg_isready -U postgres

# Проверить миграции
docker exec viably-backend alembic -c alembic.ini current
```

### "Stuck deploying" проекты

При рестарте backend автоматически сбрасывает проекты со статусом `deploying` → `error`.

Если нужно вручную:
```bash
docker exec viably-postgres psql -U postgres -d viably \
  -c "UPDATE projects SET status='error' WHERE status='deploying';"
```

### Нет места на диске

```bash
# Очистить неиспользуемые образы
docker image prune -f

# Очистить всё неиспользуемое (кроме volumes)
docker system prune -f

# Очистить старые логи
find /var/lib/docker/containers -name "*.log" -exec truncate -s 0 {} \;
```

### Rate limit ошибки

```bash
# Посмотреть rate limit ключи в Redis
docker exec viably-redis redis-cli keys "ratelimit:*" | wc -l

# Сбросить rate limit для конкретного IP
docker exec viably-redis redis-cli del "ratelimit:{ip}"
```

---

## Полезные Shell алиасы

Добавить в `~/.bashrc` на сервере:

```bash
alias vps='cd /home/viably'
alias vlogs='cd /home/viably && make logs'
alias vps_backend='docker exec -it viably-backend bash'
alias vps_db='docker exec -it viably-postgres psql -U postgres -d viably'
alias vps_status='docker ps --filter "name=viably-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
```
