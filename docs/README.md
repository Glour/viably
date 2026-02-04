# 📚 Viably Documentation

This directory contains all technical specifications and development documentation for Viably.

---

## 📖 Documentation Structure

### Core Documents
- **[master-spec.md](./master-spec.md)** - Complete system architecture, tech stack, and design decisions
- **[database-schema.sql](./database-schema.sql)** - Full PostgreSQL database schema with all tables
- **[api-contracts.md](./api-contracts.md)** - Complete REST API specification
- **[pricing-model.md](./pricing-model.md)** - Credits system and monetization strategy

### Backend Module Specifications
Located in `/docs/backend/` - detailed specifications for each backend module:

1. **[auth-module.md](./backend/auth-module.md)** - Authentication & JWT
2. **[users-module.md](./backend/users-module.md)** - User management
3. **[credits-module.md](./backend/credits-module.md)** - Credit system
4. **[projects-module.md](./backend/projects-module.md)** - Project CRUD
5. **[templates-module.md](./backend/templates-module.md)** - Template management
6. **[ai-module.md](./backend/ai-module.md)** - AI code generation
7. **[deploy-module.md](./backend/deploy-module.md)** - Deployment automation

### Frontend Screen Specifications
Located in `/docs/frontend/` - detailed UI/UX specifications:

1. **[auth-screens.md](./frontend/auth-screens.md)** - Login/Register
2. **[dashboard.md](./frontend/dashboard.md)** - Main dashboard
3. **[template-gallery.md](./frontend/template-gallery.md)** - Template selection
4. **[generation-flow.md](./frontend/generation-flow.md)** - Code generation UI

---

## 🔧 How to Use This Documentation

### For Development with Claude Code

Each module specification is designed to be fed directly into Claude Code Orchestrator:

```bash
# Example: Building auth module
cd viably/backend
claude-code

# In Claude Code chat:
"Create the auth module according to ../docs/backend/auth-module.md"
```

### Module Specification Format

Each module spec includes:
- **Overview** - What the module does
- **Dependencies** - Required packages
- **Database Models** - Tables and relationships
- **API Endpoints** - Request/response schemas
- **Business Logic** - Core functions
- **File Structure** - Where code goes
- **Tests** - What to test
- **Examples** - Usage examples

---

## 📋 Development Order

Follow this order when building:

### Phase 1: Backend Foundation
1. Auth Module (Week 1)
2. Users Module (Week 1)
3. Credits Module (Week 2)
4. Projects Module (Week 3)
5. Templates Module (Week 3)
6. AI Module (Week 4)
7. Deploy Module (Week 4)

### Phase 2: Frontend
1. Auth Screens (Week 5)
2. Dashboard (Week 6)
3. Template Gallery (Week 7)
4. Generation Flow (Week 8)

---

## 🎯 Quick Reference

### Current Status
- **Phase:** 0 - Planning
- **Last Updated:** February 4, 2026
- **Next Milestone:** Auth module implementation

### Key Decisions
- **Backend:** FastAPI + SQLAlchemy
- **Frontend:** Next.js 14 + shadcn/ui
- **Database:** PostgreSQL 15
- **AI:** Claude Sonnet 4
- **Deploy:** Railway API

---

## 📝 Notes

### For Developers
- Read [master-spec.md](./master-spec.md) first to understand overall architecture
- Each module is independent - can be built in parallel
- All specs are optimized for Claude Code generation
- Follow file structure exactly as specified

### For Product
- [pricing-model.md](./pricing-model.md) has business model details
- Template ideas and features are in template module specs
- UI/UX mockups are referenced in frontend specs

---

## 🔄 Updates

This documentation is living and will be updated as the project evolves.

**Last Major Update:** February 4, 2026
