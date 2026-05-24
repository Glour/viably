# Viably

AI-powered vibe-coding platform for building Telegram bots and web apps from a chat-based workflow. Users choose a template, describe the product they want, generate code with AI and deploy the result through a managed container stack.

This repository is a public portfolio snapshot. Production secrets and deployment state are intentionally excluded.

## What it does

- chat-based AI code generation
- template gallery for bots, APIs and SaaS-like apps
- project workspace and generated code management
- GitHub integration for generated projects
- one-click Docker-based deployment flow
- credit-based billing model
- backend API, frontend app and proxy layer

## Tech stack

- Backend: FastAPI, SQLAlchemy, Alembic, Celery
- Frontend: Next.js, TypeScript, shadcn/ui, TanStack Query
- Data: PostgreSQL, Redis
- AI: Anthropic-compatible provider layer
- Deploy: Docker Compose, Nginx, Certbot
- Monitoring: Sentry/Dozzle-style runtime logs

## Architecture

```text
User
  -> Next.js frontend
  -> FastAPI backend
  -> PostgreSQL / Redis
  -> AI generation service
  -> project files / templates
  -> deploy pipeline
```

Repository layout:

- `backend/` - API, services, models and integrations
- `frontend/` - web application
- `templates/` - starter projects
- `viably-proxy/` - provider proxy layer
- `docker/` - container configuration
- `docs/` - architecture, API and operations docs
- `specs/` - product specifications

## Quick start

```bash
git clone https://github.com/viably-labs/viably.git
cd viably
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# fill placeholders locally
make dev
```

Local URLs:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:8000/api-docs`
- logs: `http://localhost:9999`

## Security model

Real values are never stored in git. Use `.env.example` files only as placeholders.

Do not commit:

- `.env` with real credentials
- database dumps
- build artifacts such as `.next/`
- provider API keys
- payment secrets
- OAuth tokens
- production host details

## Documentation

- `docs/ARCHITECTURE.md` - architecture overview
- `docs/API.md` - API surface
- `docs/DATABASE.md` - data model
- `docs/DEPLOYMENT.md` - deploy notes
- `docs/pricing-model.md` - credit and pricing model
- `SECURITY.md` - public security policy

## License

Proprietary. See `LICENSE`.
