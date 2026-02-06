# Frontend Module: Projects List & Detail

## Описание
Список проектов (grid/list view), детальная страница проекта (overview, code, logs, settings tabs).

## Зависимости
- 01-design-system
- 03-dashboard (project card component — shared)

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 1-2 дня

---

## Задачи

### Task 1: Projects List Page
**Файл:** `app/(main)/projects/page.tsx`
**Описание:** Список всех проектов пользователя

**Header:**
- H1: "Мои проекты" + "+ Новый проект" (gradient button, right-aligned)
- Subtitle: "{count} проектов из {limit} ({plan} план)"

**Toolbar:**
- Search input (🔍 Поиск..., debounced)
- Filter dropdown: Все / Deployed / Generated / Draft / Failed
- Sort dropdown: Новые первые / Старые / По имени
- View toggle: Grid ◻ | List ☰

**Grid View (default on desktop):**
- 3 columns, gap 24px
- Project cards: emoji + name, status badge, description (line-clamp 2), updated time, action menu (⋮)

**List View:**
- Table-like rows: emoji + name | category | status badge | updated time | ⋮ menu
- Hover: subtle bg

**Action Menu (⋮ dropdown):**
- Open
- Duplicate
- Download (ZIP)
- --- divider ---
- Delete (danger red text, confirmation modal)

**Empty State:**
- Centered illustration
- "У тебя пока нет проектов"
- "Создай первый бот за 60 секунд!"
- [Выбрать шаблон →] gradient button → /templates
- [Создать с нуля →] secondary button → /projects/new

**Acceptance Criteria:**
- [ ] Grid and List views toggle
- [ ] Search, filter, sort work
- [ ] Action menu with all items
- [ ] Empty state with CTAs
- [ ] Responsive (1 column on mobile, list view default)

### Task 2: Project Card Component
**Файл:** `components/projects/project-card.tsx`
**Описание:** Reusable project card для grid view

**Элементы:**
- Emoji icon (32px) + Project name (16px, 600)
- Status badge (pill): 
  - ⚪ Draft (neutral)
  - 🔵 Generating (info, animated pulse)
  - 🟡 Generated (warning/amber)
  - 🟢 Deployed (success)
  - 🔴 Failed (error)
  - ⚫ Stopped (neutral dark)
- Description (13px, text-secondary, line-clamp 2)
- Footer: relative time + ⋮ menu button
- Hover: card lift + gradient line top

**Acceptance Criteria:**
- [ ] All status badges
- [ ] Generating status has pulse animation
- [ ] Hover effects
- [ ] Action menu

### Task 3: Project Detail Page
**Файл:** `app/(main)/projects/[id]/page.tsx`
**Описание:** Детальная страница проекта с табами

**Header:**
- "← Назад к проектам" breadcrumb
- Project info card:
  - Emoji + Name (H2) + Status badge
  - Category + Created date
  - Action buttons: [Открыть в Telegram] [Редеплоить] [📥 ZIP] [⚙ Settings dropdown]

**Tabs:** [Overview] [Code] [Logs] [Settings]

**Tab: Overview:**
- Config section: key-value pairs of project configuration
- Deployment Info: Railway URL, bot username, status, running since, cost estimate

**Tab: Code (Task 4)**
**Tab: Logs (Task 5)**
**Tab: Settings (Task 6)**

**Acceptance Criteria:**
- [ ] Header with project info
- [ ] Tab navigation (URL-based: ?tab=overview)
- [ ] Overview displays config and deploy info

### Task 4: Code Viewer Tab
**Файл:** `components/projects/code-viewer.tsx`
**Описание:** Monaco Editor с файловым деревом (read-only)

**Layout:**
```
┌──────────┬─────────────────────────────────┐
│ File Tree│  Monaco Editor (read-only)      │
│ (200px)  │                                  │
│          │  Syntax highlighting             │
│ main.py  │  Line numbers                    │
│ config.py│  Minimap                         │
│ handlers/│                                  │
│  shop.py │                                  │
│  cart.py │                                  │
│ models.py│                                  │
│          │                                  │
└──────────┴─────────────────────────────────┘
```

**File Tree:**
- Folder/file icons
- Click file → loads in editor
- Active file highlighted

**Monaco Editor:**
- Read-only mode
- Python syntax highlighting
- Dark theme always (even in light mode — code editors look better dark)
- JetBrains Mono font
- Line numbers + minimap

**Acceptance Criteria:**
- [ ] File tree navigation works
- [ ] Monaco loads and displays code
- [ ] Syntax highlighting for Python
- [ ] Read-only (no editing)

### Task 5: Logs Tab
**Файл:** `components/projects/logs-viewer.tsx`
**Описание:** Terminal-style log viewer

**Styling:**
- Dark bg (#0D1117), JetBrains Mono font
- Colored output: timestamps (gray), INFO (green), WARNING (yellow), ERROR (red)
- Auto-scroll to bottom
- "Clear" button
- Filter by level: All / Info / Warning / Error

**For MVP:** Mock log data. Real-time WebSocket logs in later phase.

**Acceptance Criteria:**
- [ ] Terminal appearance
- [ ] Colored log levels
- [ ] Auto-scroll
- [ ] Level filter

### Task 6: Project Settings Tab
**Файл:** `components/projects/project-settings.tsx`
**Описание:** Настройки проекта

**Sections:**
- **Environment Variables:** Key-value editor, add/remove rows, masked values (show/hide toggle)
- **Actions:** 
  - Stop/Start bot (toggle, green/red)
  - Redeploy (secondary button)
  - Download code (ZIP)
- **Danger Zone:** 
  - Delete project (red card, button with confirmation modal)
  - "This action cannot be undone. This will permanently delete the project and stop the deployed bot."

**Acceptance Criteria:**
- [ ] Env vars editor works
- [ ] Stop/Start toggle
- [ ] Delete confirmation modal
- [ ] Danger zone styled appropriately (red border card)
