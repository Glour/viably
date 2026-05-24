# 🚀 Деплой Viably

## Требования

- **Сервер:** Ubuntu 22.04+ (ARM64 или x86_64)
- **Docker:** 24.0+
- **Docker Compose:** 2.20+ (v2, не v1)
- **Git**
- **Nginx** (на хосте, для SSL и поддоменов)
- **Certbot** (для SSL сертификатов)
- **Доменное имя** (или wildcard DNS для поддоменов деплоев)

---

## Первоначальная установка

### 1. Клонировать репозиторий

```bash
git clone git@github.com:Glour/viably.git /home/viably
cd /home/viably
```

### 2. Создать .env файлы

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env  # заполнить все переменные

# Frontend
cp frontend/.env.local.example frontend/.env.local
nano frontend/.env.local  # заполнить переменные
```

### 3. Создать директории для деплоев

```bash
mkdir -p /opt/viably-deploys
mkdir -p /opt/viably-sites
```

### 4. Подготовить Docker

```bash
# Убедиться что docker socket доступен
ls -la /var/run/docker.sock

# Создать сеть (если не существует)
docker network create viably-network 2>/dev/null || true
```

### 5. Запустить базы данных и применить миграции

```bash
cd /home/viably

# Запустить только postgres и redis
docker compose up -d postgres redis

# Подождать healthcheck
sleep 10

# Применить миграции
docker compose run --rm backend-prod alembic -c alembic.ini upgrade head

# Загрузить шаблоны (если есть скрипт)
docker compose run --rm backend-prod python seed_templates.py 2>/dev/null || true
```

### 6. Запустить все сервисы

```bash
make prod
```

### 7. Настроить Nginx на хосте

```nginx
# /etc/nginx/sites-available/viably
server {
    listen 80;
    server_name viably.io www.viably.io;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/viably /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 8. SSL сертификат

```bash
certbot --nginx -d viably.io -d www.viably.io

# Wildcard для поддоменов деплоев
certbot certonly --manual \
  -d "*.viably.io" \
  --preferred-challenges dns
```

### 9. Запустить viably-proxy (Anthropic OAT)

```bash
cd /home/viably/viably-proxy
docker compose up -d
```

---

## Переменные окружения

### Backend (`backend/.env`)

| Переменная | Описание | Обязательная |
|-----------|---------|-------------|
| `DATABASE_URL` | PostgreSQL URL | ✅ |
| `JWT_SECRET_KEY` | Секрет для JWT токенов (мин 32 символа) | ✅ |
| `ANTHROPIC_API_KEY` | Ключ API Anthropic Claude | ✅ |
| `REDIS_URL` | Redis URL | ✅ |
| `CELERY_BROKER_URL` | Redis URL для Celery | ✅ |
| `CELERY_RESULT_BACKEND` | Redis URL для результатов Celery | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Для Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Для Google OAuth |
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | Для GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | Для GitHub OAuth |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | Для Stripe платежей |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | Для Stripe платежей |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | Для Stripe webhook |
| `YOOKASSA_SHOP_ID` | YooKassa Shop ID | Для YooKassa |
| `YOOKASSA_SECRET_KEY` | YooKassa Secret Key | Для YooKassa |
| `NOWPAYMENTS_API_KEY` | NOWPayments API Key | Для крипто-платежей |
| `NOWPAYMENTS_IPN_SECRET` | NOWPayments IPN Secret | Для крипто-платежей |
| `RESEND_API_KEY` | Resend API Key | Для email |
| `SENTRY_DSN` | Sentry DSN | Для мониторинга |
| `HETZNER_API_TOKEN` | Hetzner Cloud API Token | Для auto-provision серверов |
| `AI_GATEWAY_KEY` | Ключ viably-proxy | Для Anthropic OAT proxy |
| `ENVIRONMENT` | `development` или `production` | |
| `DEBUG` | `true`/`false` | |

### Frontend (`frontend/.env.local`)

| Переменная | Описание |
|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL backend API (https://viably.io/api) |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL (wss://viably.io/ws) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key |
| `INTERNAL_API_URL` | Внутренний URL для SSR (http://backend:8000) |

---

## Обновление существующего деплоя

```bash
cd /home/viably

# 1. Получить новый код
git pull origin main

# 2. Применить миграции (если есть)
docker compose --profile prod exec backend-prod alembic -c alembic.ini upgrade head

# 3. Пересобрать образы
make build

# 4. Перезапустить сервисы
make prod

# 5. Переподключить deployed ботов
make reconnect-bots
```

---

## CI/CD (опционально)

Пример GitHub Actions workflow для auto-deploy:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/viably
            git pull origin main
            make build
            make prod
            make reconnect-bots
```

---

## Ролбэк

```bash
cd /home/viably

# Откатиться к предыдущему коммиту
git log --oneline -10
git checkout {commit_hash}

# Пересобрать
make build && make prod
```

---

## Мониторинг после деплоя

```bash
# Проверить что всё запустилось
make ps
docker ps --filter "name=viably-" --format "table {{.Names}}\t{{.Status}}"

# Проверить health
curl http://localhost:8000/health
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3000

# Следить за логами первые минуты
make logs
```
