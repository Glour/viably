# Data Model: Documentation & Content Module

**Feature**: Documentation & Content Module
**Date**: 2026-02-08
**Branch**: 001-docs-content

## Overview

This module primarily deals with **static content** (documentation pages, blog posts, email templates) stored as files, not database entities. However, there are a few data points that need to be tracked in the database for email notifications.

## Entities

### 1. EmailLog (Database Entity)

**Purpose**: Track sent emails for debugging, compliance, and analytics

**Storage**: PostgreSQL table `email_logs`

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | UUID | Yes | Primary key | Auto-generated |
| user_id | UUID | Yes | Foreign key to users table | References users.id |
| email_type | Enum | Yes | Type of email sent | One of: WELCOME, GENERATION_COMPLETE, DEPLOY_SUCCESS, LOW_CREDITS |
| recipient_email | String | Yes | Email address where sent | Valid email format |
| subject | String | Yes | Email subject line | Max 200 chars |
| template_variables | JSON | No | Variables used in template | Valid JSON object |
| status | Enum | Yes | Delivery status | One of: PENDING, SENT, FAILED, BOUNCED |
| error_message | String | No | Error if failed | Max 500 chars |
| sent_at | Timestamp | No | When email was sent | ISO 8601 format |
| created_at | Timestamp | Yes | When log entry created | Auto-generated |
| resend_message_id | String | No | Resend API message ID | Max 100 chars |

**Relationships**:
- Belongs to: User (many EmailLogs to one User)

**Indexes**:
- Primary: `id`
- Foreign key: `user_id`
- Query optimization: `(user_id, created_at)` for user email history
- Query optimization: `(email_type, status)` for monitoring

**State Transitions**:
```
PENDING → SENT (successful delivery)
PENDING → FAILED (temporary error, can retry)
PENDING → BOUNCED (permanent error, invalid email)
```

**Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email_type": "WELCOME",
  "recipient_email": "user@example.com",
  "subject": "Добро пожаловать в Viably! 🚀",
  "template_variables": {
    "name": "Александр",
    "credits": 5,
    "dashboard_url": "https://viably.dev/dashboard"
  },
  "status": "SENT",
  "error_message": null,
  "sent_at": "2026-02-08T12:00:00Z",
  "created_at": "2026-02-08T11:59:50Z",
  "resend_message_id": "re_abc123xyz"
}
```

---

### 2. DocumentationPage (Static File)

**Purpose**: Static MDX files for documentation pages

**Storage**: Filesystem at `/frontend/content/docs/`

**Structure**:
```mdx
---
title: Quick Start Guide
description: Create your first Telegram bot in 5 minutes
slug: quickstart
category: getting-started
order: 1
lastUpdated: 2026-02-08
---

# Quick Start

Content here...
```

**Frontmatter Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | Yes | Page title |
| description | String | Yes | Meta description for SEO |
| slug | String | Yes | URL slug (e.g., "quickstart") |
| category | String | Yes | Section category |
| order | Number | No | Display order in navigation |
| lastUpdated | Date | Yes | Last content update date |

**File naming convention**: `{slug}.mdx`

**Categories**:
- `getting-started`: Quick Start
- `templates`: Template guides (shop-bot, faq-bot, etc.)
- `faq`: Frequently Asked Questions

---

### 3. BlogPost (Static File)

**Purpose**: Static MDX files for blog articles

**Storage**: Filesystem at `/frontend/content/blog/`

**Structure**:
```mdx
---
title: Как создать Telegram-бота за 60 секунд
description: Step-by-step tutorial по созданию Telegram-бота с Viably
slug: create-telegram-bot-60-seconds
author: Viably Team
publishedAt: 2026-02-08
updatedAt: 2026-02-08
category: tutorial
tags: [telegram, bot, tutorial, быстрый старт]
keywords: создать telegram бота, telegram bot builder, ai генерация бота
excerpt: Узнайте, как создать полноценного Telegram-бота без программирования за 60 секунд с помощью Viably AI.
coverImage: /blog/create-bot-cover.jpg
---

# Content here...
```

**Frontmatter Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | Yes | Post title |
| description | String | Yes | Meta description for SEO |
| slug | String | Yes | URL slug |
| author | String | Yes | Author name |
| publishedAt | Date | Yes | Publication date |
| updatedAt | Date | No | Last update date |
| category | String | Yes | Post category |
| tags | Array | Yes | Tags for categorization |
| keywords | String | Yes | SEO keywords (comma-separated) |
| excerpt | String | Yes | Short summary (150-200 chars) |
| coverImage | String | No | Cover image path |

**File naming convention**: `{slug}.mdx`

**Categories**:
- `tutorial`: How-to guides
- `business`: Business use cases
- `announcement`: Product announcements

---

### 4. EmailTemplate (Static File)

**Purpose**: React Email component files for email templates

**Storage**: Filesystem at `/frontend/emails/`

**Structure**:
```tsx
// emails/WelcomeEmail.tsx
import { Button, Container, Html, Text } from 'react-email';

interface WelcomeEmailProps {
  name: string;
  credits: number;
  dashboardUrl: string;
}

export default function WelcomeEmail({
  name,
  credits,
  dashboardUrl
}: WelcomeEmailProps) {
  return (
    <Html>
      <Container>
        <Text>Привет, {name}!</Text>
        <Text>У тебя {credits} кредитов для старта.</Text>
        <Button href={dashboardUrl}>Создать первый бот</Button>
      </Container>
    </Html>
  );
}
```

**Props Interface**:

Each email template exports a TypeScript interface defining required variables.

**Template Inventory**:

| Template | File | Props |
|----------|------|-------|
| Welcome Email | `WelcomeEmail.tsx` | `{ name: string, credits: number, dashboardUrl: string }` |
| Generation Complete | `GenerationCompleteEmail.tsx` | `{ name: string, projectName: string, deployUrl: string, downloadUrl: string }` |
| Deploy Success | `DeploySuccessEmail.tsx` | `{ name: string, botUsername: string, botUrl: string }` |
| Low Credits Warning | `LowCreditsWarning.tsx` | `{ name: string, credits: number, topUpUrl: string }` |

---

### 5. SocialMediaAsset (Static File)

**Purpose**: Social media content and visual assets

**Storage**:
- Text content: `/frontend/content/social/`
- Visual assets: `/frontend/public/social/`

**Text Content Structure** (`/content/social/producthunt.md`):
```md
---
platform: producthunt
---

# Tagline
AI-powered Telegram bot builder — create bots in 60 seconds

# Description
Problem: Building Telegram bots requires coding skills...
Solution: Viably generates production-ready bots with AI...
```

**Visual Assets**:
- ProductHunt: `screenshot-{1-5}.png`, `demo.gif`
- Twitter: `twitter-demo.gif`
- Reddit: `reddit-screenshot.png`

---

## Data Flow Diagrams

### Email Sending Flow

```
User Action (Registration/Generation/Deploy)
  ↓
Backend Event Handler
  ↓
Email Service (emailService.send)
  ↓
Create EmailLog (status: PENDING)
  ↓
Render Email Template with variables
  ↓
Call Resend API
  ↓
Update EmailLog (status: SENT/FAILED)
  ↓
If FAILED: Schedule retry (Celery task)
```

### Documentation Page Rendering

```
User requests /docs/quickstart
  ↓
Next.js App Router
  ↓
Load MDX file from /content/docs/quickstart.mdx
  ↓
Parse frontmatter (title, description)
  ↓
Compile MDX to React components
  ↓
Generate metadata (SEO tags)
  ↓
Render page with layout
```

### Blog Post Rendering

```
User requests /blog/create-telegram-bot-60-seconds
  ↓
Next.js App Router
  ↓
Load MDX file from /content/blog/{slug}.mdx
  ↓
Parse frontmatter (title, tags, keywords, etc.)
  ↓
Compile MDX to React components
  ↓
Generate metadata (SEO tags, Open Graph)
  ↓
Render page with blog layout
```

---

## Validation Rules

### EmailLog

- `email_type`: Must be one of the defined enum values
- `recipient_email`: Must be valid email format (validated with `email-validator`)
- `status`: Must be one of PENDING, SENT, FAILED, BOUNCED
- `template_variables`: Must be valid JSON object

### DocumentationPage (Frontmatter)

- `title`: Required, 1-100 characters
- `description`: Required, 50-200 characters (SEO best practice)
- `slug`: Required, lowercase, alphanumeric + hyphens only
- `category`: Must be one of: getting-started, templates, faq
- `lastUpdated`: Required, valid ISO date

### BlogPost (Frontmatter)

- `title`: Required, 10-70 characters (SEO best practice)
- `description`: Required, 50-160 characters
- `slug`: Required, lowercase, alphanumeric + hyphens only
- `publishedAt`: Required, valid ISO date
- `category`: Must be one of: tutorial, business, announcement
- `tags`: Required, 1-10 tags, each 2-20 characters
- `keywords`: Required, comma-separated, 3-10 keywords
- `excerpt`: Required, 100-200 characters

---

## Database Schema (PostgreSQL)

```sql
-- Email logs table
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    template_variables JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message VARCHAR(500),
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resend_message_id VARCHAR(100),

    CONSTRAINT email_type_check CHECK (
        email_type IN ('WELCOME', 'GENERATION_COMPLETE', 'DEPLOY_SUCCESS', 'LOW_CREDITS')
    ),
    CONSTRAINT status_check CHECK (
        status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')
    )
);

-- Indexes for performance
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_user_created ON email_logs(user_id, created_at DESC);
CREATE INDEX idx_email_logs_type_status ON email_logs(email_type, status);
CREATE INDEX idx_email_logs_status_created ON email_logs(status, created_at)
    WHERE status IN ('PENDING', 'FAILED');
```

---

## File System Structure

```
frontend/
├── content/
│   ├── docs/
│   │   ├── quickstart.mdx
│   │   ├── faq.mdx
│   │   └── templates/
│   │       ├── shop-bot.mdx
│   │       ├── faq-bot.mdx
│   │       ├── support-bot.mdx
│   │       ├── booking-bot.mdx
│   │       ├── poll-bot.mdx
│   │       └── notifications-bot.mdx
│   ├── blog/
│   │   ├── create-telegram-bot-60-seconds.mdx
│   │   ├── telegram-bot-ideas-small-business.mdx
│   │   └── viably-launch-announcement.mdx
│   └── social/
│       ├── producthunt.md
│       ├── twitter-thread.md
│       └── reddit-post.md
├── emails/
│   ├── WelcomeEmail.tsx
│   ├── GenerationCompleteEmail.tsx
│   ├── DeploySuccessEmail.tsx
│   └── LowCreditsWarning.tsx
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
    │   └── email_log.py  # SQLAlchemy model
    └── services/
        └── email_service.py  # Email sending logic
```

---

## Notes

- **No user-generated content**: All documentation and blog content is created by the Viably team, stored as static files
- **Email logging is append-only**: Never delete EmailLog entries (needed for compliance and debugging)
- **Static content versioning**: MDX files are version-controlled in Git, updated via code deployments
- **No database for content**: Documentation and blog posts are NOT stored in PostgreSQL - they're static MDX files compiled at build time
- **Email templates compiled at build time**: React Email components are compiled to HTML during frontend build, served as static assets

---

## Migration Strategy

### Phase 1: Create email_logs table

```sql
-- Run migration: 001_create_email_logs.sql
CREATE TABLE email_logs (...);
CREATE INDEX ...;
```

### Phase 2: Add content directories

```bash
mkdir -p frontend/content/{docs/templates,blog,social}
mkdir -p frontend/emails
mkdir -p frontend/public/social/{producthunt,twitter}
```

### Phase 3: Create placeholder files

Create MDX templates for each documentation page and blog post with basic frontmatter structure.

---

## Conclusion

This data model defines:
- ✅ 1 database entity (EmailLog) for tracking email delivery
- ✅ 4 static file structures (Documentation, Blog, EmailTemplate, SocialMediaAsset)
- ✅ Validation rules for all content types
- ✅ File system organization
- ✅ Database schema for email logging

**Next step**: Define API contracts in `/contracts/` directory for email service integration.
