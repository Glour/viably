# Implementation Plan: Documentation & Content Module

**Branch**: `001-docs-content` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-docs-content/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement comprehensive documentation, blog content, email notification system, and social media assets for the Viably platform launch. The module includes:

- **Documentation**: Quick Start guide, 6 template-specific guides, FAQ page (static MDX content)
- **Blog**: 3 SEO-optimized posts for launch (static MDX content)
- **Email System**: 4 transactional email templates with Resend integration (React Email + FastAPI)
- **Demo Video**: YouTube embedding with performance optimization
- **Social Media**: Launch assets for ProductHunt, Twitter, Reddit, Telegram

**Technical Approach**:
- Frontend: Next.js MDX support for documentation/blog, React Email for templates
- Backend: FastAPI email service with PostgreSQL logging, Resend API integration
- No external CMS needed - static MDX files version-controlled in Git
- Performance: Static site generation (SSG), lite-youtube-embed, lazy loading

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x, React 19.2.3, Node.js 18+
- Backend: Python 3.12+

**Primary Dependencies**:
- Frontend: Next.js 16.1.6, @next/mdx, react-email, @react-email/components
- Backend: FastAPI 0.109+, resend (Python SDK), SQLAlchemy 2.0+ (async), Pydantic 2.5+

**Storage**:
- Database: PostgreSQL (email_logs table only)
- Content: Filesystem (MDX files in /frontend/content/, email templates in /frontend/emails/)

**Testing**:
- Frontend: Playwright (existing), Lighthouse CI (performance)
- Backend: pytest (existing), email template rendering tests

**Target Platform**:
- Frontend: Web browsers (modern evergreen browsers)
- Backend: Linux server (Railway/production environment)

**Project Type**: Web application (Next.js frontend + FastAPI backend)

**Performance Goals**:
- Documentation pages: First Contentful Paint < 1.5s
- Email delivery: < 5 seconds from trigger to sent
- Blog posts: Lighthouse score > 90
- Video embedding: Reduce page load by 500ms vs standard iframe

**Constraints**:
- Email rate limiting: Max 100 emails/user/hour (prevent abuse)
- Resend free tier: 3000 emails/month (sufficient for MVP)
- MDX compilation: Build-time only (no runtime compilation)
- Content updates: Require code deployment (no live CMS)

**Scale/Scope**:
- Documentation: 8 MDX pages (1 Quick Start, 6 templates, 1 FAQ)
- Blog: 3 posts at launch
- Email templates: 4 types
- Expected email volume: ~500-1000/month at launch
- No user-generated content (all curated by Viably team)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Context-First Development
- **Status**: PASS
- **Evidence**: Research phase completed (research.md) with library evaluation before implementation

### ✅ II. Single Source of Truth
- **Status**: PASS
- **Evidence**:
  - Email templates: Single source in /frontend/emails/, compiled at build time
  - Documentation: Single MDX file per page in /frontend/content/docs/
  - No duplication of content

### ✅ III. Library-First Development
- **Status**: PASS
- **Evidence**: Research phase identified and selected existing libraries:
  - @next/mdx (official Next.js package) for documentation
  - react-email (100k+ downloads/week) for email templates
  - Resend (official SDK) for email sending
  - Built-in Next.js Metadata API for SEO (no third-party library needed)

### ✅ IV. Code Reuse & DRY
- **Status**: PASS
- **Evidence**:
  - Reusing existing Next.js infrastructure (no new framework)
  - Shared email components in /frontend/emails/components/
  - Template inheritance for blog/docs layouts

### ✅ V. Strict Type Safety
- **Status**: PASS
- **Evidence**:
  - TypeScript interfaces for email template props
  - Zod schemas for email service validation (backend)
  - Type-safe MDX frontmatter parsing
  - No `any` types permitted

### ✅ VI. Atomic Task Execution
- **Status**: PASS
- **Evidence**: Tasks will be broken down into atomic units:
  - Task 1: Backend email service (database + service + API)
  - Task 2: Email templates (React Email components)
  - Task 3: Documentation system (MDX setup + pages)
  - Task 4: Blog system (MDX + SEO)
  - Task 5: Video embedding
  - Task 6: Social media assets

### ✅ VII. Quality Gates
- **Status**: PASS
- **Evidence**:
  - Type-check required before commit
  - Build must succeed (MDX compilation validation)
  - No hardcoded RESEND_API_KEY (environment variable only)
  - Email validation with email-validator library

### ✅ VIII. Progressive Specification
- **Status**: PASS
- **Evidence**:
  - Phase 0: Spec created ✅
  - Phase 1: Plan in progress ✅
  - Phase 2: Tasks (next step after plan approval)
  - Phase 3: Implementation (awaiting tasks)

### ✅ IX. Error Handling
- **Status**: PASS
- **Evidence**:
  - Custom EmailServiceError classes for typed errors
  - Email failures logged in database with error_message field
  - Retry logic for transient failures (Celery tasks)
  - User-facing errors: "Email not sent" with fallback to in-app notifications

### ✅ X. Observability
- **Status**: PASS
- **Evidence**:
  - Structured logging with structlog (already in backend)
  - Email logs table for audit trail
  - Sentry integration (already in stack) for error tracking
  - Resend dashboard for delivery metrics

### ✅ XI. Accessibility
- **Status**: PASS (RECOMMENDED level)
- **Evidence**:
  - MDX content is semantic HTML (accessible by default)
  - Email templates use semantic HTML elements
  - Video embedding includes proper alt text and titles
  - No interactive elements in documentation (static content)

**Post-Design Re-check**: All gates remain PASS after research and data model design.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── research/            # Complex research (if needed - for deep research tasks)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Structure Decision**: Web application (Option 2) - separate backend and frontend

```text
backend/
├── src/
│   ├── models/
│   │   └── email_log.py               # EmailLog SQLAlchemy model
│   ├── services/
│   │   └── email_service.py           # Email sending service (Resend integration)
│   ├── api/
│   │   └── v1/
│   │       └── emails.py              # Email API endpoints
│   └── celery_tasks/
│       └── email_tasks.py             # Async email sending tasks
├── alembic/
│   └── versions/
│       └── 001_create_email_logs.py   # Database migration
└── tests/
    ├── unit/
    │   └── test_email_service.py      # Email service unit tests
    └── integration/
        └── test_email_api.py          # Email API integration tests

frontend/
├── content/                            # Static MDX content (version-controlled)
│   ├── docs/
│   │   ├── quickstart.mdx             # Quick Start guide
│   │   ├── faq.mdx                    # FAQ page
│   │   └── templates/
│   │       ├── shop-bot.mdx           # Shop Bot guide
│   │       ├── faq-bot.mdx            # FAQ Bot guide
│   │       ├── support-bot.mdx        # Support Bot guide
│   │       ├── booking-bot.mdx        # Booking Bot guide
│   │       ├── poll-bot.mdx           # Poll Bot guide
│   │       └── notifications-bot.mdx  # Notifications Bot guide
│   ├── blog/
│   │   ├── create-telegram-bot-60-seconds.mdx
│   │   ├── telegram-bot-ideas-small-business.mdx
│   │   └── viably-launch-announcement.mdx
│   └── social/
│       ├── producthunt.md             # ProductHunt submission text
│       ├── twitter-thread.md          # Twitter launch thread
│       └── reddit-post.md             # Reddit launch post
├── emails/                             # React Email components
│   ├── components/                     # Shared email components
│   │   ├── Button.tsx
│   │   ├── Container.tsx
│   │   └── Header.tsx
│   ├── WelcomeEmail.tsx
│   ├── GenerationCompleteEmail.tsx
│   ├── DeploySuccessEmail.tsx
│   └── LowCreditsWarning.tsx
├── src/
│   ├── app/
│   │   ├── docs/
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx           # Dynamic doc page
│   │   │   └── templates/
│   │   │       └── [slug]/
│   │   │           └── page.tsx       # Dynamic template guide page
│   │   └── blog/
│   │       ├── page.tsx               # Blog index
│   │       └── [slug]/
│   │           └── page.tsx           # Dynamic blog post page
│   └── components/
│       └── video/
│           └── LiteYouTube.tsx        # YouTube embedding component
└── public/
    └── social/
        ├── producthunt/
        │   ├── screenshot-1.png
        │   ├── screenshot-2.png
        │   ├── screenshot-3.png
        │   ├── screenshot-4.png
        │   ├── screenshot-5.png
        │   └── demo.gif
        └── twitter/
            └── demo.gif
```

**Key Design Decisions**:

1. **Content as Code**: All documentation and blog content stored as MDX files in Git (not in database or CMS)
   - **Why**: Enables version control, code review, rollback capability
   - **Trade-off**: Content updates require deployment (acceptable for curated content)

2. **Email Templates as React Components**: Use React Email instead of raw HTML templates
   - **Why**: Type-safe props, component reuse, familiar React syntax
   - **Trade-off**: Requires build step, but improves maintainability

3. **Minimal Database Schema**: Only `email_logs` table for tracking delivery
   - **Why**: Documentation/blog content is static, doesn't need CRUD operations
   - **Trade-off**: No dynamic content editing, but reduces complexity

4. **Static Site Generation (SSG)**: Build documentation/blog pages at compile time
   - **Why**: Maximum performance, SEO-friendly, low server load
   - **Trade-off**: Content changes require rebuild (acceptable for infrequent updates)

## Complexity Tracking

**No constitutional violations** - All checks PASS.

No complexity tracking needed.
