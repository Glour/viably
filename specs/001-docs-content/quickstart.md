# Quick Start: Documentation & Content Module

**Feature**: Documentation & Content Module
**Branch**: 001-docs-content
**Date**: 2026-02-08

## Overview

This feature adds documentation, blog content, email templates, and social media assets to the Viably platform. The implementation is split between frontend (Next.js) and backend (FastAPI).

## Prerequisites

Before starting implementation, ensure:

- ✅ Next.js 16.1.6 frontend is set up
- ✅ FastAPI backend with PostgreSQL is running
- ✅ Resend account created (free tier: 3000 emails/month)
- ✅ YouTube video recorded and uploaded (for demo embedding)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Static MDX   │  │ Email        │  │ Social Media    │  │
│  │ Content      │  │ Templates    │  │ Assets          │  │
│  │              │  │ (React Email)│  │ (Static Files)  │  │
│  │ /content/    │  │ /emails/     │  │ /public/social/ │  │
│  │  - docs/     │  │  - Welcome   │  │  - Screenshots  │  │
│  │  - blog/     │  │  - GenDone   │  │  - GIFs         │  │
│  │  - social/   │  │  - Deploy    │  │                 │  │
│  │              │  │  - LowCred   │  │                 │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         ↓                  ↓                    ↓          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Next.js App Router                                  │  │
│  │ - /docs/[slug]  → Documentation pages              │  │
│  │ - /blog/[slug]  → Blog posts with SEO              │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Email Service                                        │  │
│  │ - EmailLog model (PostgreSQL)                       │  │
│  │ - EmailService (send emails via Resend)            │  │
│  │ - Celery tasks for async sending                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ External: Resend API                                │  │
│  │ - Sends transactional emails                        │  │
│  │ - Handles unsubscribe links                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
frontend/
├── content/
│   ├── docs/
│   │   ├── quickstart.mdx              # Quick Start guide
│   │   ├── faq.mdx                     # FAQ page
│   │   └── templates/
│   │       ├── shop-bot.mdx            # Shop Bot guide
│   │       ├── faq-bot.mdx             # FAQ Bot guide
│   │       ├── support-bot.mdx         # Support Bot guide
│   │       ├── booking-bot.mdx         # Booking Bot guide
│   │       ├── poll-bot.mdx            # Poll Bot guide
│   │       └── notifications-bot.mdx   # Notifications Bot guide
│   ├── blog/
│   │   ├── create-telegram-bot-60-seconds.mdx
│   │   ├── telegram-bot-ideas-small-business.mdx
│   │   └── viably-launch-announcement.mdx
│   └── social/
│       ├── producthunt.md              # ProductHunt submission text
│       ├── twitter-thread.md           # Twitter launch thread
│       └── reddit-post.md              # Reddit launch post
├── emails/
│   ├── components/                     # Shared email components
│   │   ├── Button.tsx
│   │   ├── Container.tsx
│   │   └── Header.tsx
│   ├── WelcomeEmail.tsx
│   ├── GenerationCompleteEmail.tsx
│   ├── DeploySuccessEmail.tsx
│   └── LowCreditsWarning.tsx
├── src/
│   └── app/
│       ├── docs/
│       │   ├── [slug]/
│       │   │   └── page.tsx            # Dynamic doc page
│       │   └── templates/
│       │       └── [slug]/
│       │           └── page.tsx        # Dynamic template guide page
│       └── blog/
│           ├── page.tsx                # Blog index
│           └── [slug]/
│               └── page.tsx            # Dynamic blog post page
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

backend/
└── src/
    ├── models/
    │   └── email_log.py                # EmailLog SQLAlchemy model
    ├── services/
    │   └── email_service.py            # Email sending service
    ├── api/
    │   └── v1/
    │       └── emails.py               # Email API endpoints
    └── celery_tasks/
        └── email_tasks.py              # Async email sending tasks
```

## Step-by-Step Implementation

### Phase 1: Backend - Email Service

**1.1. Create database migration**

Create file: `backend/alembic/versions/001_create_email_logs.py`

```python
"""Create email_logs table

Revision ID: 001_email_logs
Revises:
Create Date: 2026-02-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_email_logs'
down_revision = None

def upgrade():
    op.create_table(
        'email_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email_type', sa.String(50), nullable=False),
        sa.Column('recipient_email', sa.String(255), nullable=False),
        sa.Column('subject', sa.String(200), nullable=False),
        sa.Column('template_variables', postgresql.JSONB),
        sa.Column('status', sa.String(20), nullable=False, server_default='PENDING'),
        sa.Column('error_message', sa.String(500)),
        sa.Column('sent_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('resend_message_id', sa.String(100)),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint(
            "email_type IN ('WELCOME', 'GENERATION_COMPLETE', 'DEPLOY_SUCCESS', 'LOW_CREDITS')",
            name='email_type_check'
        ),
        sa.CheckConstraint(
            "status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')",
            name='status_check'
        )
    )

    op.create_index('idx_email_logs_user_id', 'email_logs', ['user_id'])
    op.create_index('idx_email_logs_user_created', 'email_logs', ['user_id', 'created_at'])
    op.create_index('idx_email_logs_type_status', 'email_logs', ['email_type', 'status'])

def downgrade():
    op.drop_table('email_logs')
```

Run migration:
```bash
cd backend
alembic upgrade head
```

**1.2. Install Resend SDK**

```bash
cd backend
pip install resend
```

Add to `pyproject.toml`:
```toml
dependencies = [
    # ... existing deps
    "resend>=0.7.0",
]
```

**1.3. Add environment variable**

`.env`:
```bash
RESEND_API_KEY=re_your_api_key_here
```

**1.4. Create EmailLog model**

Create: `backend/src/models/email_log.py`

```python
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from src.database import Base

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email_type = Column(String(50), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(200), nullable=False)
    template_variables = Column(JSONB)
    status = Column(String(20), nullable=False, default="PENDING")
    error_message = Column(String(500))
    sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resend_message_id = Column(String(100))
```

**1.5. Create EmailService**

Create: `backend/src/services/email_service.py`

```python
import resend
from typing import Dict, Any
from datetime import datetime
from src.models.email_log import EmailLog
from src.database import get_db

resend.api_key = "re_your_api_key"  # Load from settings

class EmailService:
    TEMPLATES = {
        "WELCOME": {
            "subject": "Добро пожаловать в Viably! 🚀",
            "html": """
                <h1>Привет, {name}!</h1>
                <p>Ты зарегистрировался в Viably. У тебя {credits} кредитов для старта.</p>
                <a href="{dashboard_url}">Создать первый бот →</a>
            """
        },
        # Add other templates...
    }

    async def send_email(
        self,
        user_id: str,
        email_type: str,
        recipient_email: str,
        template_variables: Dict[str, Any],
        db: Session
    ):
        # Create email log
        email_log = EmailLog(
            user_id=user_id,
            email_type=email_type,
            recipient_email=recipient_email,
            subject=self.TEMPLATES[email_type]["subject"],
            template_variables=template_variables,
            status="PENDING"
        )
        db.add(email_log)
        await db.commit()

        try:
            # Render template
            html = self.TEMPLATES[email_type]["html"].format(**template_variables)

            # Send via Resend
            response = resend.Emails.send({
                "from": "Viably <hello@viably.dev>",
                "to": recipient_email,
                "subject": email_log.subject,
                "html": html
            })

            # Update log
            email_log.status = "SENT"
            email_log.sent_at = datetime.utcnow()
            email_log.resend_message_id = response["id"]
            await db.commit()

        except Exception as e:
            email_log.status = "FAILED"
            email_log.error_message = str(e)
            await db.commit()
            raise
```

### Phase 2: Frontend - Email Templates

**2.1. Install React Email**

```bash
cd frontend
npm install react-email @react-email/components
```

**2.2. Create email components**

Create: `frontend/emails/WelcomeEmail.tsx`

```tsx
import { Html, Button, Container, Text, Head } from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  credits: number;
  dashboardUrl: string;
}

export default function WelcomeEmail({ name, credits, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Container>
        <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Привет, {name}!
        </Text>
        <Text style={{ fontSize: '16px', color: '#666' }}>
          Ты зарегистрировался в Viably — теперь ты можешь создавать Telegram-ботов за 60 секунд.
        </Text>
        <Text>У тебя уже есть {credits} кредитов для старта.</Text>
        <Button
          href={dashboardUrl}
          style={{
            background: '#000',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '5px',
          }}
        >
          Создать первый бот →
        </Button>
      </Container>
    </Html>
  );
}
```

Repeat for other templates (GenerationComplete, DeploySuccess, LowCredits).

### Phase 3: Frontend - Documentation Pages

**3.1. Install MDX support**

```bash
cd frontend
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

**3.2. Configure Next.js for MDX**

Update `next.config.ts`:

```typescript
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
});
```

**3.3. Create MDX content**

Create: `frontend/content/docs/quickstart.mdx`

```mdx
---
title: Quick Start Guide
description: Создай своего первого бота за 5 минут
slug: quickstart
category: getting-started
order: 1
lastUpdated: 2026-02-08
---

# Quick Start: Создай первый бот за 5 минут

## Шаг 1: Зарегистрируйся

Перейди на [viably.dev](https://viably.dev) и нажми "Начать бесплатно".

![Регистрация](../images/registration.png)

## Шаг 2: Выбери шаблон

Выбери один из 6 готовых шаблонов...
```

**3.4. Create dynamic doc page**

Create: `frontend/src/app/docs/[slug]/page.tsx`

```tsx
import fs from 'fs/promises';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import { Metadata } from 'next';

interface DocPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { frontmatter } = await getDocContent(params.slug);

  return {
    title: `${frontmatter.title} | Viably Docs`,
    description: frontmatter.description,
  };
}

async function getDocContent(slug: string) {
  const filePath = path.join(process.cwd(), 'content', 'docs', `${slug}.mdx`);
  const source = await fs.readFile(filePath, 'utf-8');

  return compileMDX({
    source,
    options: { parseFrontmatter: true },
  });
}

export default async function DocPage({ params }: DocPageProps) {
  const { content, frontmatter } = await getDocContent(params.slug);

  return (
    <div className="prose max-w-4xl mx-auto p-6">
      <h1>{frontmatter.title}</h1>
      <p className="text-gray-600">{frontmatter.description}</p>
      {content}
    </div>
  );
}
```

### Phase 4: Frontend - Blog Pages

Similar to documentation, create `/blog/[slug]/page.tsx` with SEO metadata.

### Phase 5: Video Embedding

Create: `frontend/src/components/video/LiteYouTube.tsx`

```tsx
export function LiteYouTube({ videoId }: { videoId: string }) {
  return (
    <div className="aspect-video w-full">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="Viably Demo"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-lg"
      />
    </div>
  );
}
```

## Testing

### Backend Tests

```bash
cd backend
pytest tests/test_email_service.py
```

### Frontend Tests

```bash
cd frontend
npm run build  # Ensure MDX compiles
npm run lint
```

## Deployment

**1. Backend**

```bash
# Run migrations on production
alembic upgrade head

# Set environment variable
export RESEND_API_KEY=re_prod_key
```

**2. Frontend**

```bash
# Build static pages
npm run build

# Deploy to Vercel/Railway
```

## Monitoring

- Email delivery rate: Monitor via Resend dashboard
- Email logs: Query `email_logs` table for failures
- Documentation: Monitor page views via analytics

## Troubleshooting

**Email not sending?**
- Check `RESEND_API_KEY` is set correctly
- Verify email log status in database
- Check Resend dashboard for API errors

**MDX not compiling?**
- Ensure frontmatter is valid YAML
- Check MDX syntax with online validator
- Verify `@next/mdx` is installed

## Next Steps

After completing this feature:
1. Create actual content for all MDX files
2. Record and upload demo video to YouTube
3. Create social media visual assets
4. Test email deliverability across clients
5. Run SEO audit on blog posts
6. Launch ProductHunt submission

## Resources

- [React Email Documentation](https://react.email)
- [Resend API Docs](https://resend.com/docs)
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx)
- [Email Template Best Practices](https://react.email/docs/introduction)
