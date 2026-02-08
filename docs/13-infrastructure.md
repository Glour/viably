# Launch Module: Infrastructure & DevOps

## Описание
Production deployment: домен, хостинг, CI/CD, мониторинг, бэкапы, environment configuration. Всё что нужно чтобы viably.dev работал в проде.

## Зависимости
- Все модули интеграции (09-12) завершены
- Рабочее приложение на localhost

## Сложность: Средняя
## Приоритет: P0 (Must — без этого нет продакшена)
## Estimated: 2 дня

---

## Задачи

### Task 1: Production Environment Setup
**Описание:** Разворачивание инфраструктуры

**Backend (Railway или DigitalOcean App Platform):**
- FastAPI app → Docker container
- PostgreSQL (managed) → Railway Postgres или Supabase
- Redis → Upstash (serverless) или Railway Redis
- Celery workers → отдельный service в Railway

**Frontend (Vercel):**
- Next.js → Vercel deployment (автоматический из GitHub)
- Edge functions для middleware
- CDN для статики

**Dockerfiles:**
```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# celery worker
CMD ["celery", "-A", "app.core.celery_app", "worker", "--loglevel=info"]
```

**Acceptance Criteria:**
- [ ] Backend деплоится на Railway/DO
- [ ] Frontend деплоится на Vercel
- [ ] PostgreSQL production instance работает
- [ ] Redis production instance работает
- [ ] Celery workers запущены

### Task 2: Domain & SSL
**Описание:** Настройка домена viably.dev

**DNS Records:**
- `viably.dev` → Vercel (frontend)
- `api.viably.dev` → Railway/DO (backend)
- `www.viably.dev` → redirect → `viably.dev`

**SSL:** Автоматический через Vercel (frontend) и Railway (backend)

**Environment Variables (Production):**
```bash
# Backend
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/viably_prod
REDIS_URL=redis://user:pass@host:6379
JWT_SECRET_KEY=<generated-64-char>
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGINS=https://viably.dev
RAILWAY_TOKEN=...
ENVIRONMENT=production

# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://api.viably.dev
NEXT_PUBLIC_WS_URL=wss://api.viably.dev
NEXT_PUBLIC_SITE_URL=https://viably.dev
```

**Acceptance Criteria:**
- [ ] viably.dev открывает landing/app
- [ ] api.viably.dev отвечает на /health
- [ ] HTTPS везде
- [ ] www redirect работает

### Task 3: CI/CD Pipeline
**Файл:** `.github/workflows/deploy.yml`
**Описание:** GitHub Actions для автоматического деплоя

**Pipeline:**
```yaml
# На push в main:
1. Run linters (ESLint, Ruff)
2. Run type checks (TypeScript, mypy)
3. Run tests (pytest, vitest)
4. Build frontend (next build)
5. Deploy backend → Railway (auto via GitHub integration)
6. Deploy frontend → Vercel (auto via GitHub integration)
```

**Branch strategy:**
- `main` → production (auto-deploy)
- `develop` → staging (auto-deploy to preview)
- Feature branches → PR previews (Vercel)

**Acceptance Criteria:**
- [ ] Push to main → auto deploy
- [ ] Tests run on PR
- [ ] Failed tests block merge
- [ ] Preview deployments для PRs

### Task 4: Monitoring & Alerts
**Описание:** Мониторинг production

**Sentry (Error Tracking):**
- Frontend: `@sentry/nextjs`
- Backend: `sentry-sdk[fastapi]`
- Source maps uploaded
- Alert: email на критичные ошибки

**Uptime Monitoring:**
- BetterStack / UptimeRobot (бесплатный tier)
- Мониторить: viably.dev, api.viably.dev/health
- Alert: Telegram/email при downtime

**Analytics:**
- PostHog (free tier, self-hosted optional)
- Ключевые события: signup, project_created, generation_started, generation_complete, deployed, purchased_credits
- Funnels: Landing → Signup → First Project → Generation → Deploy

**Logging:**
- Backend: structured JSON logs (loguru)
- Railway/DO logs dashboard
- Log rotation

**Acceptance Criteria:**
- [ ] Sentry работает, ошибки отправляются
- [ ] Uptime monitor настроен + алерты
- [ ] PostHog трекает ключевые события
- [ ] Logs доступны в dashboard

### Task 5: Database Backups & Security
**Описание:** Бэкапы и базовая безопасность

**Backups:**
- PostgreSQL: ежедневные автоматические (Railway/Supabase встроенные)
- Retention: 7 дней
- Ручной бэкап перед каждым крупным деплоем

**Security Checklist:**
- [ ] JWT secret — 64+ символов, сгенерированный
- [ ] Все секреты в environment variables (не в коде)
- [ ] CORS — только viably.dev
- [ ] Rate limiting: 60 req/min для auth endpoints, 30 для generation
- [ ] Input validation на всех endpoints (Pydantic)
- [ ] SQL injection protection (SQLAlchemy ORM)
- [ ] HTTPS forced (redirect HTTP → HTTPS)
- [ ] Secure cookie flags (httpOnly, secure, sameSite)
- [ ] Helmet headers (via middleware)

**Acceptance Criteria:**
- [ ] Автоматические бэкапы настроены
- [ ] Security checklist пройден
- [ ] Rate limiting работает
