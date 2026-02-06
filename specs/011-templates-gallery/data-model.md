# Data Model: Templates Gallery

**Feature**: 011-templates-gallery
**Date**: 2026-02-06

## Entities

### Template

Предустановленный шаблон бота для создания проекта.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| slug | string | yes | Уникальный идентификатор (URL-safe) |
| name | string | yes | Название шаблона |
| emoji | string | yes | Эмодзи-иконка (один символ) |
| description | string | yes | Описание шаблона (2-3 предложения) |
| category | "telegram_bot" | yes | Категория бота |
| creditCost | number | yes | Стоимость в кредитах (>=1) |
| features | string[] | yes | Список возможностей (1-6 элементов) |
| tags | string[] | yes | Теги для фильтрации |
| configFields | ConfigField[] | yes | Поля конфигурации проекта |
| isPopular | boolean | yes | Флаг популярности |

**Validation rules**:
- `slug`: lowercase, a-z, 0-9, hyphens only, unique
- `creditCost`: integer >= 1
- `features`: min 1, max 6 elements
- `configFields`: min 1 element

### ConfigField

Описание поля конфигурации, которое пользователь заполняет при создании проекта.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Программное имя поля (camelCase) |
| label | string | yes | Отображаемая метка |
| type | ConfigFieldType | yes | Тип ввода |
| required | boolean | yes | Обязательность заполнения |
| placeholder | string | no | Текст-подсказка в поле |
| options | string[] | no | Варианты для select/multiselect |

**ConfigFieldType**: `"text"` | `"textarea"` | `"select"` | `"multiselect"` | `"number"`

**Validation rules**:
- `options` обязательно для type `"select"` и `"multiselect"`, запрещено для остальных типов
- `name` уникален в пределах одного Template

### TemplateFilter

Состояние фильтрации на странице галереи.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| searchQuery | string | yes | Текст поискового запроса (default: "") |
| activeTab | FilterTab | yes | Активная вкладка фильтра (default: "all") |

**FilterTab**: `"all"` | `"telegram"` | `"popular"` | `"cheap"`

**Filter logic**:
- `"all"` — все шаблоны
- `"telegram"` — `template.category === "telegram_bot"`
- `"popular"` — `template.isPopular === true`
- `"cheap"` — `template.creditCost < 5`
- `searchQuery` — case-insensitive match в `template.name` или `template.description`
- Фильтры комбинируются: tab filter AND search filter

## Relationships

```
Template 1──* ConfigField (embedded, not separate entity)
TemplateFilter → Template[] (derived: filtered subset)
UserProfile.credits → Template.creditCost (comparison for create button state)
```

## Mock Data (6 Templates)

| # | slug | name | emoji | creditCost | isPopular | features count |
|---|------|------|-------|------------|-----------|----------------|
| 1 | faq-bot | FAQ Bot | ❓ | 3 | false | 3 |
| 2 | shop-bot | Shop Bot | 🛒 | 5 | true | 4 |
| 3 | notification-bot | Notification Bot | 🔔 | 3 | false | 3 |
| 4 | poll-bot | Poll Bot | 📊 | 4 | false | 4 |
| 5 | support-bot | Support Bot | 🎫 | 6 | false | 4 |
| 6 | booking-bot | Booking Bot | 📅 | 8 | false | 4 |

## State Management

### Templates Store (Zustand)

```
TemplatesStoreState:
  templates: Template[]       — все шаблоны (загружаются из mock)
  searchQuery: string         — текущий поисковый запрос
  activeTab: FilterTab        — активная вкладка фильтра
  isLoading: boolean          — состояние загрузки

  Actions:
  loadTemplates()             — загрузить шаблоны из mock API
  setSearchQuery(q: string)   — установить поисковый запрос
  setActiveTab(tab: FilterTab)— установить активную вкладку
  resetFilters()              — сбросить все фильтры

  Derived:
  getFilteredTemplates()      — вернуть отфильтрованный список
  getTemplateBySlug(slug)     — найти шаблон по slug
```
