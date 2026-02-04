# Data Model: Templates Module

**Feature**: 004-templates-module
**Date**: 2026-02-04

## Entities

### Template

Represents a reusable template for generating bots or API services.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default uuid4 | Unique identifier |
| name | String(255) | NOT NULL | Display name |
| slug | String(255) | UNIQUE, NOT NULL, INDEX | URL-friendly identifier |
| description | Text | NULL | Full description |
| category | String(50) | NOT NULL, INDEX | Template category |
| credit_cost | Integer | NOT NULL, DEFAULT 0, >= 0 | Credits required to use |
| config_schema | JSONB | NOT NULL, DEFAULT {} | JSON Schema for configuration |
| code_template | JSONB | NULL, DEFAULT {} | Code generation template |
| prompt_template | Text | NOT NULL | AI prompt template |
| preview_image_url | Text | NULL | Preview image URL |
| features | ARRAY(Text) | DEFAULT [] | List of features |
| tags | ARRAY(Text) | DEFAULT [] | Searchable tags |
| usage_count | Integer | NOT NULL, DEFAULT 0 | Times used |
| is_active | Boolean | NOT NULL, DEFAULT true | Visibility flag |
| sort_order | Integer | NOT NULL, DEFAULT 0 | Display order |
| created_at | DateTime(tz) | server_default=now() | Creation timestamp |
| updated_at | DateTime(tz) | onupdate=now() | Last update timestamp |

**Indexes**:
- `ix_templates_slug` (UNIQUE) - Fast lookup by slug
- `ix_templates_category` - Category filtering
- `ix_templates_is_active` - Active template filtering (partial index recommended)

### Category (Enumeration)

| Value | Description |
|-------|-------------|
| telegram_bot | Telegram bot templates |
| api_service | API service templates |

*Note: Stored as String, not DB enum, for flexibility in adding new categories.*

## Relationships

### Current Module

No relationships within templates module.

### Future Relationships (Out of Scope)

- `Template` → `Project` (one-to-many): Projects created from template
- `Template` → `User` (via Project): Users who used template

## Validation Rules

### Template

| Field | Rule |
|-------|------|
| name | Required, max 255 chars |
| slug | Required, unique, max 255 chars, lowercase alphanumeric with hyphens |
| category | Required, must be one of: telegram_bot, api_service |
| credit_cost | Required, non-negative integer |
| config_schema | Required, valid JSON object |
| prompt_template | Required, non-empty string |
| features | Array of non-empty strings |
| tags | Array of non-empty strings |

### Slug Format

- Lowercase letters, numbers, hyphens only
- No leading/trailing hyphens
- No consecutive hyphens
- Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`

## State Transitions

### Template Lifecycle

```
┌─────────┐
│ Created │ (is_active=true by default)
└────┬────┘
     │
     ▼
┌─────────┐  deactivate   ┌────────────┐
│ Active  │ ────────────► │  Inactive  │
└────┬────┘               └─────┬──────┘
     │                          │
     │    reactivate            │
     │ ◄────────────────────────┘
     │
     ▼
┌─────────────┐
│  Used       │ (usage_count incremented)
│  (Active)   │
└─────────────┘
```

**State Rules**:
- Only active templates are visible to users
- Inactive templates return 404 on direct access
- Usage count only increments for active templates
- Templates cannot be deleted (soft-delete via is_active)

## Example Data

### FAQ Bot Template

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "FAQ Bot",
  "slug": "faq-bot",
  "description": "Simple Q&A bot with inline buttons for quick answers",
  "category": "telegram_bot",
  "credit_cost": 3,
  "config_schema": {
    "type": "object",
    "properties": {
      "bot_name": {
        "type": "string",
        "title": "Bot Name",
        "description": "Display name for your bot"
      },
      "faq_items": {
        "type": "array",
        "title": "FAQ Items",
        "items": {
          "type": "object",
          "properties": {
            "question": {"type": "string"},
            "answer": {"type": "string"}
          },
          "required": ["question", "answer"]
        },
        "minItems": 1
      }
    },
    "required": ["bot_name", "faq_items"]
  },
  "prompt_template": "Create a Telegram FAQ bot named '{{bot_name}}' with these Q&A pairs: {{faq_items}}...",
  "features": ["Inline keyboard", "Quick answers", "Easy setup"],
  "tags": ["telegram", "simple", "faq"],
  "usage_count": 320,
  "is_active": true,
  "sort_order": 1
}
```

## Migration Notes

### Table Creation

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    credit_cost INTEGER NOT NULL DEFAULT 0 CHECK (credit_cost >= 0),
    config_schema JSONB NOT NULL DEFAULT '{}',
    code_template JSONB DEFAULT '{}',
    prompt_template TEXT NOT NULL,
    preview_image_url TEXT,
    features TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX ix_templates_slug ON templates(slug);
CREATE INDEX ix_templates_category ON templates(category);
CREATE INDEX ix_templates_is_active ON templates(is_active) WHERE is_active = true;
```

### SQLite Compatibility (Testing)

- JSONB → JSON (automatic SQLAlchemy mapping)
- TEXT[] → JSON array (stored as JSON string)
- TIMESTAMPTZ → TEXT (ISO format)
