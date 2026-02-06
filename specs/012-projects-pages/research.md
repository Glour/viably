# Research: Projects List & Detail Pages

**Branch**: `012-projects-pages` | **Date**: 2026-02-06

## R-001: Code Editor Component

**Decision**: Use `@monaco-editor/react` v4.7.0

**Rationale**:
- 380K+ weekly downloads, Microsoft-backed, actively maintained
- Zero webpack configuration needed with Next.js App Router
- Supports all requirements: read-only, dark theme, JetBrains Mono, line numbers, minimap
- Python syntax highlighting built-in
- React 19 compatible
- Package size: 153KB (Monaco core lazy-loaded from CDN at ~1.2MB gzipped)

**Alternatives considered**:
- **Shiki** (695KB gzipped): Static syntax highlighter only, no editor features (no minimap, no line numbers navigation). Good for code snippets, not for a code viewer panel.
- **prism-react-renderer**: Lightweight (~7KB) but no editor features. Only suitable for inline code blocks.
- **react-simple-code-editor**: Minimal editor, no minimap/file tree integration, designed for editable snippets.

**Library**: `@monaco-editor/react` v4.7.0 — chosen because it's the de facto React wrapper for Monaco, covers 100% of requirements, and requires zero config with Next.js App Router (`"use client"` directive is sufficient).

## R-002: File Tree Component

**Decision**: Custom implementation using recursive React component

**Rationale**:
- The file tree is simple (mock data, <20 files, 2-3 nesting levels)
- Existing project uses no tree libraries, so keeping dependency count low
- Custom implementation: ~60 lines of code with lucide-react icons
- Full control over styling to match project design system

**Alternatives considered**:
- **react-folder-tree** (40KB): Full-featured but adds unnecessary dependency for a simple read-only mock tree.
- **react-arborist** (342KB): Overkill — designed for 500+ node virtualized trees. The mock tree has ~10 files.

**Library**: None — custom implementation preferred due to simplicity.

## R-003: shadcn/ui Components Needed

**Decision**: Install DropdownMenu, Tabs, Dialog, Select, Switch, AlertDialog, Tooltip

**Rationale**:
- **DropdownMenu**: Action menu (⋮) on project cards — standard pattern
- **Tabs**: Project detail page tabs (Overview, Code, Logs, Settings)
- **Dialog**: Delete confirmation modal
- **Select**: Filter and sort dropdowns on projects list
- **Switch**: Bot start/stop toggle in Settings tab
- **AlertDialog**: Danger zone delete confirmation (better UX than Dialog for destructive actions)
- **Tooltip**: Action button tooltips on project detail header

These are all Radix-based shadcn/ui primitives — consistent with existing `new-york` style.

**Currently installed**: Badge, Button, Card, Checkbox, Form, Input, Label, Separator, Shimmer, Sonner

## R-004: Grid/List View Toggle Pattern

**Decision**: Zustand store state with `viewMode: "grid" | "list"` + responsive default

**Rationale**:
- Follows existing store pattern (templates store)
- Session-only persistence (store resets on page reload per spec assumptions)
- Default: `grid` on desktop (>= 640px), `list` on mobile (< 640px)
- `useMediaQuery` or window check for responsive default — use existing pattern or simple `typeof window !== 'undefined'` check

**Alternatives considered**:
- URL query parameter (?view=grid): Adds complexity without benefit for MVP, not bookmarkable
- localStorage: Spec says session-only, no cross-session persistence

## R-005: URL-based Tab Navigation

**Decision**: Use `useSearchParams` from Next.js for `?tab=overview|code|logs|settings`

**Rationale**:
- Follows Next.js App Router patterns
- Tabs are bookmarkable and shareable
- Default tab: `overview` when no query param present
- Shallow navigation (no full page reload)

**Library**: Built-in Next.js `useSearchParams` + `useRouter` — no additional library needed.

## R-006: Log Viewer Component

**Decision**: Custom terminal-style component with mock data

**Rationale**:
- Simple CSS-based terminal look (dark background, monospace font, colored text)
- Mock data array with LogEntry objects
- Filter by log level — simple array filter
- Auto-scroll with `useRef` + `scrollIntoView`
- No need for virtualization (mock data is <100 entries)

**Alternatives considered**:
- **xterm.js** / **@xterm/xterm**: Full terminal emulator — overkill for read-only log display.
- **react-lazylog**: Designed for streaming logs — unnecessary for mock data MVP.

## R-007: Environment Variables Editor

**Decision**: Custom key-value editor with local state

**Rationale**:
- Simple form with dynamic rows (add/remove)
- Each row: key input + value input + show/hide toggle + delete button
- Local component state (not in Zustand store — settings are per-session mock)
- Validation: keys must match `^[a-zA-Z_][a-zA-Z0-9_-]*$`

**Alternatives considered**:
- react-hook-form with dynamic fields: Adds complexity for a simple mock editor. RHF is available but unnecessary here.

## R-008: Existing Code Reuse Analysis

**Reusable from current codebase**:
- `MainLayout` — page wrapper with navbar
- `FadeInUp` — staggered animation wrapper
- `Shimmer` — loading skeletons
- `useDebounce` hook — search input debouncing
- `EmptyState` pattern — from templates gallery (adapt, not copy)
- `Badge` component — for status badges (existing variants: success, warning, destructive)
- `Card` component — for project cards
- `Button` component — all action buttons
- `Input` component — search input
- `cn()` utility — className merging

**Need to extend**:
- `Badge` variants: Need to add `info` (blue, for Generating) and `neutral-dark` (for Stopped)
- `ProjectStatus` type: Currently has 4 statuses in dashboard types, need to expand to 6

**New components needed**:
- `ProjectCard` — grid view card
- `ProjectListRow` — list view row
- `ProjectDetail` — detail page layout
- `CodeViewer` — Monaco editor + file tree
- `LogsViewer` — terminal-style logs
- `ProjectSettings` — settings sections
- `EnvVarEditor` — key-value environment variable editor
- `DangerZone` — destructive actions section
