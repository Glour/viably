# Viably Backend

FastAPI application for Viably platform.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Environment variables:**
```bash
cp .env.example .env
# Edit .env with your values
```

4. **Run migrations:**
```bash
alembic upgrade head
```

5. **Start development server:**
```bash
uvicorn app.main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`  
Docs: `http://localhost:8000/docs`

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── auth/           # Authentication module
│   ├── users/          # User management
│   ├── credits/        # Credit system
│   ├── projects/       # Projects CRUD
│   ├── templates/      # Templates
│   ├── ai/            # AI generation
│   ├── deploy/        # Deployment
│   ├── core/          # Shared code
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── deps.py
│   └── main.py        # FastAPI app
├── tests/             # Test files
├── alembic/           # Database migrations
├── requirements.txt
└── .env.example
```

---

## 🔧 Development

### Running Tests
```bash
pytest
pytest --cov=app tests/  # With coverage
```

### Database Migrations

**Create migration:**
```bash
alembic revision --autogenerate -m "description"
```

**Apply migrations:**
```bash
alembic upgrade head
```

**Rollback:**
```bash
alembic downgrade -1
```

### Code Quality

**Format code:**
```bash
black app tests
```

**Lint:**
```bash
ruff check app tests
```

**Type check:**
```bash
mypy app
```

---

## 📝 Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/viably

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...

# Railway (for deployments)
RAILWAY_API_TOKEN=...

# Environment
ENVIRONMENT=development  # development, staging, production
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:3000,https://viably.dev
```

---

## 🐳 Docker

**Build:**
```bash
docker build -t viably-backend .
```

**Run:**
```bash
docker run -p 8000:8000 --env-file .env viably-backend
```

**Docker Compose:**
```bash
docker-compose up
```

---

## 📚 API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

---

## 🧪 Testing

### Test Structure
```
tests/
├── conftest.py          # Pytest fixtures
├── test_auth.py         # Auth tests
├── test_users.py        # User tests
├── test_credits.py      # Credits tests
├── test_projects.py     # Projects tests
└── test_templates.py    # Templates tests
```

### Running Specific Tests
```bash
pytest tests/test_auth.py
pytest tests/test_auth.py::test_register_success
pytest -k "auth"  # Run tests matching "auth"
```

---

## 📦 Dependencies

**Core:**
- FastAPI - Web framework
- SQLAlchemy - ORM
- Alembic - Migrations
- Pydantic - Validation
- asyncpg - PostgreSQL driver

**Auth:**
- python-jose - JWT
- passlib - Password hashing
- python-multipart - Form data

**AI:**
- anthropic - Claude API

**Tasks:**
- Celery - Background jobs
- Redis - Task queue

**Dev:**
- pytest - Testing
- black - Formatting
- ruff - Linting
- mypy - Type checking

---

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens for auth
- HTTPS only in production
- CORS configured
- SQL injection prevention (SQLAlchemy)
- Rate limiting
- Input validation (Pydantic)

---

## 🚀 Deployment

See [deployment guide](../docs/deployment.md)

---

## 📖 Module Documentation

All module specifications are in `/docs/backend/`:

- [Auth Module](../docs/backend/auth-module.md)
- [Users Module](../docs/backend/users-module.md)
- [Credits Module](../docs/backend/credits-module.md)
- [Projects Module](../docs/backend/projects-module.md)
- [AI Module](../docs/backend/ai-module.md)
- [Deploy Module](../docs/backend/deploy-module.md)

---

## 🤝 Contributing

1. Read module specification in `/docs/backend/`
2. Create feature branch
3. Write tests first
4. Implement feature
5. Run tests and linters
6. Create pull request

---

**Status:** In Development  
**Python Version:** 3.11+  
**Framework:** FastAPI 0.109+
