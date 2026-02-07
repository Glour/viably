# 🚀 Viably

**AI-powered platform for building Telegram bots and backend applications**

> *From vibe to viable* - Vibe coding for everyone

---

### Команды для Claude Code

```bash
# Повторяем цикл:
/speckit.analyze docs/backend/users-module.md
/speckit.specify
/speckit.plan
/speckit.implement  # для каждой задачи
/speckit.checklist
/push patch

# После завершения всех модулей — Health Checks:

# 1. Проверка багов
/health-bugs
# Сканирует весь код, находит и исправляет баги

# 2. Security audit
/health-security
# Проверяет SQL injection, XSS, auth issues

# 3. Dead code cleanup
/health-cleanup
# Находит unused imports, commented code

# 4. Code reuse
/health-reuse
# Находит дублированный код и консолидирует

# 5. Dependencies
/health-deps
# Проверяет outdated packages и обновляет

/health-metrics
```

## 📖 About

Viably is an AI-powered development platform that helps non-technical users and developers build functional backend applications and Telegram bots through natural language.

**Key Features:**
- 🤖 AI-powered code generation (Claude Sonnet 4)
- ⚡ Template gallery (Telegram bots, APIs, services)
- 🚀 One-click deploy to production
- 💳 Credit-based pricing system
- 🇷🇺 Russian-first UX

**Tech Stack:**
- **Backend:** FastAPI (Python 3.11+)
- **Frontend:** Next.js 14 + shadcn/ui
- **Database:** PostgreSQL 15 + Redis
- **AI:** Anthropic Claude API
- **Deploy:** Railway (for user bots)

---

## 📁 Project Structure

```
viably/
├── docs/              # Technical specifications
├── backend/           # FastAPI application
├── frontend/          # Next.js application
└── README.md
```

---

## 📚 Documentation

All technical specifications are in `/docs`:

- **[Master Spec](docs/master-spec.md)** - System architecture & overview
- **[Database Schema](docs/database-schema.sql)** - Complete DB structure
- **[API Contracts](docs/api-contracts.md)** - All endpoints
- **[Pricing Model](docs/pricing-model.md)** - Credits & monetization
- **[Backend Modules](docs/backend/)** - Detailed module specifications

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15
- Redis 7
- Docker (for local dev)

### Development Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

**Full Stack (Docker):**
```bash
docker-compose up
```

---

## 📋 Roadmap

### Phase 0: Foundation ✅
- [x] Project setup
- [x] Documentation structure
- [x] Tech stack decision

### Phase 1: Backend MVP (4 weeks)
- [ ] Authentication & Users
- [ ] Credits System
- [ ] AI Integration
- [ ] Projects & Templates

### Phase 2: Frontend MVP (4 weeks)
- [ ] Auth pages
- [ ] Dashboard
- [ ] Template Gallery
- [ ] Generation Flow

### Phase 3: Templates & AI (3 weeks)
- [ ] 6 bot templates
- [ ] AI prompt optimization
- [ ] Code quality improvements

### Phase 4: Deploy & Infrastructure (2 weeks)
- [ ] Railway integration
- [ ] Production setup
- [ ] Monitoring

### Phase 5: Testing & Launch (3 weeks)
- [ ] Testing
- [ ] Beta launch
- [ ] Public launch

---

## 💰 Pricing

```
FREE
├─ 5 credits on signup
├─ +5 credits per referral
├─ Max 2 projects
└─ Public projects only

STARTER - $15/month
├─ 100 credits/month
├─ +3 credits daily
├─ Private projects
└─ Email support

PRO - $39/month
├─ 300 credits/month
├─ +10 credits daily
├─ Priority AI queue
└─ Custom domains

BUSINESS - $99/month
├─ 1000 credits/month
├─ +20 credits daily
├─ Team features
└─ White-label
```

---

## 🛠 Tech Details

**Backend:**
- FastAPI for API
- SQLAlchemy + Alembic for DB
- Celery for async tasks
- Redis for caching
- JWT authentication

**Frontend:**
- Next.js 14 (App Router)
- shadcn/ui components
- TanStack Query
- Zustand for state

**AI & Generation:**
- Claude Sonnet 4 (main)
- Claude Haiku (simple tasks)
- Custom prompt templates
- Code review pipeline

**Infrastructure:**
- Docker containers
- Railway for deploys
- PostgreSQL managed
- Redis managed
- Sentry for monitoring

---

## 📄 License

Proprietary - All rights reserved

---

## 👨‍💻 Development

Built with ❤️ using Claude Code Orchestrator Kit

For detailed development instructions, see [docs/README.md](docs/README.md)
