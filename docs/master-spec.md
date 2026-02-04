# Viably - Master Technical Specification

**Version:** 1.0  
**Date:** February 4, 2026  
**Status:** Draft

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Architecture](#api-architecture)
5. [AI Integration](#ai-integration)
6. [Security & Authentication](#security--authentication)
7. [Deployment Strategy](#deployment-strategy)
8. [Scalability & Performance](#scalability--performance)
9. [Monitoring & Logging](#monitoring--logging)
10. [Development Guidelines](#development-guidelines)

---

## 1. Executive Summary

### 1.1 Product Vision

**Viably** is an AI-powered platform that enables non-technical users to create production-ready Telegram bots and backend applications through natural language descriptions.

**Key Differentiators:**
- Focus on **backend/functional applications** (not just frontend)
- **Telegram bots** as primary niche
- **Production-ready code** with best practices
- **Predictable pricing** (credit-based, not token-based)
- **Russian-language** first approach

### 1.2 Target Metrics (6 months)

```
Users:        2,000 registrations
Paying:       200 customers  
MRR:          $3,000
Bots Created: 1,000+
Conversion:   10% free → paid
```

### 1.3 MVP Scope

**Included in MVP:**
- 6 Telegram bot templates
- Credit-based pricing system
- AI code generation (Python/aiogram)
- One-click deploy to Railway
- Template customization UI
- Real-time generation progress

**NOT in MVP (v2):**
- API services generation
- Team collaboration
- Custom AI models
- Mobile apps
- White-label options

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js Frontend (viably.dev)                         │ │
│  │  - React 18                                            │ │
│  │  - shadcn/ui + Tailwind                               │ │
│  │  - TanStack Query                                      │ │
│  │  - WebSocket client                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  FastAPI Backend (api.viably.dev)                     │ │
│  │  ┌──────────────┬──────────────┬───────────────────┐ │ │
│  │  │ Auth Module  │ Credits      │ Projects Module   │ │ │
│  │  ├──────────────┼──────────────┼───────────────────┤ │ │
│  │  │ AI Module    │ Templates    │ Deploy Module     │ │ │
│  │  └──────────────┴──────────────┴───────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                        │
│  ┌──────────────────┐     ┌─────────────────────────────┐  │
│  │  Celery Workers  │────▶│  Redis Queue                │  │
│  │  - Generation    │     │  - Task distribution        │  │
│  │  - Deployments   │     │  - WebSocket messages       │  │
│  │  - Cron jobs     │     │  - Caching                  │  │
│  └──────────────────┘     └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 15                                        │  │
│  │  - Users, Projects, Templates                        │  │
│  │  - Credit transactions                                │  │
│  │  - Deployments                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                        │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Anthropic AI │ Railway API  │ GitHub (temp repos)      │ │
│  │ (Claude)     │ (deploy)     │ (code storage)           │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Backend:**
```python
Framework:    FastAPI 0.109+
Language:     Python 3.11+
ORM:          SQLAlchemy 2.0
Migrations:   Alembic
Validation:   Pydantic v2
Auth:         python-jose (JWT)
Password:     passlib[bcrypt]
Tasks:        Celery 5.3
HTTP Client:  httpx (async)
Testing:      pytest + pytest-asyncio
```

**Frontend:**
```typescript
Framework:    Next.js 14 (App Router)
Language:     TypeScript 5.3
UI:           shadcn/ui + Radix UI
Styling:      Tailwind CSS 3.4
State:        Zustand 4.5
Data:         TanStack Query v5
Forms:        React Hook Form + Zod
WebSocket:    native WebSocket API
Code Editor:  Monaco Editor (for code viewer)
```

**Infrastructure:**
```yaml
Database:     PostgreSQL 15
Cache:        Redis 7
Queue:        Redis (Celery broker)
Container:    Docker + Docker Compose
CI/CD:        GitHub Actions
Hosting:      
  - Frontend: Vercel
  - Backend:  DigitalOcean/Railway
  - DB:       Managed PostgreSQL
Deploy:       Railway API (for user bots)
Monitoring:   Sentry
Analytics:    PostHog (optional)
```

### 2.3 Module Structure

**Backend Modules:**
```
app/
├── auth/           # Authentication & authorization
├── users/          # User management
├── credits/        # Credit system & transactions
├── projects/       # Project CRUD
├── templates/      # Template management
├── ai/            # AI code generation
├── deploy/        # Deployment automation
├── core/          # Shared utilities
│   ├── config.py
│   ├── database.py
│   ├── security.py
│   └── deps.py
└── main.py        # FastAPI app entry
```

---

## 3. Database Schema

### 3.1 Core Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Plan & Credits
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
    credits INTEGER DEFAULT 5,
    
    -- Referrals
    referral_code VARCHAR(8) UNIQUE NOT NULL,
    referred_by UUID REFERENCES users(id),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_plan ON users(plan);
```

#### projects
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Project info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES templates(id),
    
    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Generated code
    generated_code JSONB,  -- {files: {path: content}}
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (
        status IN ('draft', 'generating', 'ready', 'deploying', 'deployed', 'error')
    ),
    error_message TEXT,
    
    -- Deployment
    deployed_url TEXT,
    deploy_platform VARCHAR(50),  -- 'railway', 'render'
    
    -- Visibility
    is_public BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_config CHECK (jsonb_typeof(config) = 'object')
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_template_id ON projects(template_id);
```

#### templates
```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,  -- 'telegram_bot', 'api_service'
    
    -- Pricing
    credit_cost INTEGER NOT NULL DEFAULT 0,
    
    -- Configuration schema
    config_schema JSONB NOT NULL,  -- JSON Schema for user inputs
    
    -- Code template
    code_template JSONB,  -- Base code structure
    prompt_template TEXT NOT NULL,  -- AI prompt with placeholders
    
    -- Metadata
    preview_image_url TEXT,
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Stats
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_slug ON templates(slug);
CREATE INDEX idx_templates_is_active ON templates(is_active, sort_order);
```

#### credit_transactions
```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount INTEGER NOT NULL,  -- Positive = credit, negative = debit
    balance_after INTEGER NOT NULL,
    
    -- Type
    transaction_type VARCHAR(50) NOT NULL CHECK (
        transaction_type IN (
            'signup',
            'daily_bonus',
            'referral_bonus',
            'purchase',
            'refund',
            'generation',
            'admin_adjustment'
        )
    ),
    
    -- References
    project_id UUID REFERENCES projects(id),
    related_user_id UUID REFERENCES users(id),  -- For referrals
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    description TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
```

#### deployments
```sql
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Deployment platform
    platform VARCHAR(50) NOT NULL,  -- 'railway', 'render'
    external_id VARCHAR(255),  -- Platform-specific ID
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'building', 'deploying', 'active', 'failed', 'stopped')
    ),
    
    -- URLs
    url TEXT,
    build_url TEXT,
    
    -- Logs
    logs TEXT,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deployed_at TIMESTAMP,
    
    -- Platform-specific data
    platform_data JSONB DEFAULT '{}'
);

CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_status ON deployments(status);
```

### 3.2 Relationships Diagram

```
users (1) ──────< (∞) projects
  │                      │
  │                      └──> (1) templates
  │
  ├────< (∞) credit_transactions
  │
  └────< (∞) referred users (self-reference)

projects (1) ────< (∞) deployments
```

---

## 4. API Architecture

### 4.1 API Principles

**RESTful Design:**
- Resource-based URLs
- HTTP verbs (GET, POST, PATCH, DELETE)
- Consistent response structure
- Proper HTTP status codes

**Response Format:**
```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-02-04T12:00:00Z",
    "request_id": "uuid"
  }
}
```

### 4.2 Core Endpoints

See [api-contracts.md](./api-contracts.md) for complete specification.

**Summary:**
```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

Users:
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/me/credits
GET    /api/users/me/transactions

Projects:
GET    /api/projects
POST   /api/projects
GET    /api/projects/{id}
PATCH  /api/projects/{id}
DELETE /api/projects/{id}
POST   /api/projects/{id}/generate

Templates:
GET    /api/templates
GET    /api/templates/{id}

Credits:
POST   /api/credits/purchase

Real-time:
WS     /ws/{user_id}
```

---

## 5. AI Integration

### 5.1 Model Selection

**Primary Model: Claude Sonnet 4**
- Use case: Complex bot generation, code review
- Cost: ~$0.045 per 15k tokens
- Quality: Production-ready code

**Fast Model: Claude Haiku**
- Use case: Simple modifications, quick fixes
- Cost: ~$0.01 per 15k tokens
- Quality: Good for simple tasks

### 5.2 Generation Pipeline

```
User Input
    ↓
┌─────────────────────────────────┐
│ 1. Validate & Estimate Cost     │
│    - Check credits              │
│    - Estimate complexity        │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ 2. Build Prompt                 │
│    - Load template              │
│    - Insert user config         │
│    - Add context                │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ 3. Generate Code (Claude)       │
│    - Architecture first         │
│    - Then implementation        │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ 4. Code Review (Claude)         │
│    - Security check             │
│    - Best practices             │
│    - Bug detection              │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ 5. Test in Sandbox              │
│    - Syntax validation          │
│    - Basic runtime test         │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ 6. Package & Save               │
│    - Structure files            │
│    - Generate README            │
│    - Save to DB                 │
└─────────────────────────────────┘
    ↓
Ready for Deploy
```

### 5.3 Prompt Structure

**System Prompt:**
```
You are a senior Python developer specializing in Telegram bots using aiogram 3.x.

Your task: Generate PRODUCTION-READY code.

Requirements:
- Clean, readable code
- Type hints everywhere
- Proper error handling
- Environment variables for config
- SQLite/PostgreSQL for data
- Comprehensive docstrings
- Best practices only

Output: Complete file structure with all code.
```

**User Prompt Template:**
```
Create a Telegram bot: {bot_description}

Specifications:
{user_config_as_yaml}

Technical requirements:
- Python 3.11+
- aiogram 3.x
- async/await
- SQLAlchemy for database
- .env for configuration

File structure:
bot/
├── main.py
├── config.py
├── handlers/
├── keyboards/
├── database/
└── requirements.txt

Provide complete, working code for each file.
```

---

## 6. Security & Authentication

### 6.1 Authentication Flow

**JWT-based Authentication:**
```
Login
  ↓
Generate Access Token (24h expiry)
  +
Generate Refresh Token (30d expiry)
  ↓
Return both tokens
  ↓
Client stores in httpOnly cookies
  ↓
Access Token expired?
  ↓
Use Refresh Token to get new Access Token
```

### 6.2 Security Measures

**Password Security:**
- bcrypt hashing (cost factor 12)
- Minimum 8 characters
- Complexity requirements

**API Security:**
- Rate limiting (100 req/min per IP)
- CORS properly configured
- HTTPS only in production
- SQL injection prevention (SQLAlchemy)
- XSS prevention (sanitized inputs)

**Code Execution:**
- Sandboxed Docker containers
- No network access during testing
- Resource limits (CPU, memory)
- Timeout (30s max)

---

## 7. Deployment Strategy

### 7.1 Application Deployment

**Frontend (Vercel):**
- Auto-deploy on git push
- Edge functions
- Global CDN
- Preview deployments

**Backend (DigitalOcean/Railway):**
- Docker containers
- Auto-scaling
- Health checks
- Rolling updates

### 7.2 User Bot Deployment

**Railway Integration:**
```
Generate Code
  ↓
Create Temporary GitHub Repo
  ↓
Railway Project Creation (API)
  ↓
Set Environment Variables
  ↓
Trigger Deploy
  ↓
Monitor Status via Webhook
  ↓
Update DB with URL
  ↓
Delete Temp Repo (after 24h)
```

---

## 8. Scalability & Performance

### 8.1 Performance Targets

```
API Response Time:    < 200ms (p95)
Page Load Time:       < 1s (p95)
Generation Time:      < 60s (simple bot)
Concurrent Users:     1000+
Database Queries:     < 50ms (p95)
```

### 8.2 Caching Strategy

**Redis Caching:**
- Template data (1 hour TTL)
- User session data
- Rate limiting counters
- WebSocket messages

**Database:**
- Connection pooling
- Query optimization
- Indexes on foreign keys

---

## 9. Monitoring & Logging

### 9.1 Metrics to Track

**Application:**
- Request rate
- Error rate
- Response times
- Active users

**Business:**
- New registrations
- Credit usage
- Conversions
- MRR

### 9.2 Logging

**Structured Logging:**
```python
{
  "timestamp": "2026-02-04T12:00:00Z",
  "level": "INFO",
  "service": "api",
  "user_id": "uuid",
  "request_id": "uuid",
  "message": "Project generated successfully",
  "metadata": {
    "project_id": "uuid",
    "template": "shop_bot",
    "generation_time_ms": 45000
  }
}
```

---

## 10. Development Guidelines

### 10.1 Code Style

**Python:**
- PEP 8 compliant
- Type hints mandatory
- Docstrings (Google style)
- Max line length: 100

**TypeScript:**
- ESLint + Prettier
- Strict mode enabled
- Functional components
- Named exports

### 10.2 Git Workflow

```
main          (production)
  ↑
develop       (staging)
  ↑
feature/*     (development)
```

**Commit Message Format:**
```
type(scope): description

feat(auth): add JWT refresh token
fix(credits): correct rollover calculation
docs(readme): update installation steps
```

### 10.3 Testing Requirements

**Backend:**
- Unit tests: >70% coverage
- Integration tests for all endpoints
- Load testing before launch

**Frontend:**
- Component tests
- E2E tests for critical flows
- Visual regression tests

---

## Appendix

### A. Tech Decision Log

**Why FastAPI?**
- Fast (async support)
- Auto API docs
- Type validation
- Modern Python

**Why Next.js?**
- React framework
- SSR/SSG support
- Great DX
- Vercel deployment

**Why PostgreSQL?**
- ACID compliance
- JSONB support
- Mature ecosystem
- Scalable

**Why Railway for user deploys?**
- Simple API
- Auto-scaling
- Managed infrastructure
- Fair pricing

### B. Future Considerations

**Phase 2 Features:**
- API service generation
- Team collaboration
- Custom domains
- Analytics dashboard
- Marketplace

**Technical Debt:**
- Microservices architecture
- Event sourcing
- GraphQL API
- Kubernetes

---

**Document Status:** Draft  
**Last Updated:** February 4, 2026  
**Next Review:** February 11, 2026
