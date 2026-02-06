# Data Model: Projects List & Detail Pages

**Branch**: `012-projects-pages` | **Date**: 2026-02-06

## Entities

### Project (extended from existing ProjectSummary)

```typescript
// Existing (types/index.ts)
type ProjectStatus = "deployed" | "ready" | "draft" | "failed"

// Extended for Projects module
type ProjectStatus = "draft" | "generating" | "generated" | "deployed" | "failed" | "stopped"

interface Project {
  id: string
  name: string
  emoji: string
  description: string
  status: ProjectStatus
  category: string              // e.g. "Telegram Bot"
  createdAt: string             // ISO date
  updatedAt: string             // ISO date
  config: Record<string, string> // key-value configuration pairs
  deployment: DeploymentInfo | null
  files: ProjectFile[]          // generated code files
  envVars: EnvVariable[]        // environment variables
  logs: LogEntry[]              // runtime logs (mock)
}
```

### DeploymentInfo

```typescript
interface DeploymentInfo {
  url: string                   // Railway URL
  botUsername: string            // @bot_username
  status: "running" | "stopped" | "deploying"
  runningSince: string | null   // ISO date
  costEstimate: string          // e.g. "$2.50/month"
}
```

### ProjectFile

```typescript
interface ProjectFile {
  path: string                  // relative path e.g. "handlers/shop.py"
  name: string                  // file name e.g. "shop.py"
  type: "file" | "folder"
  content?: string              // file content (only for type=file)
  children?: ProjectFile[]      // child items (only for type=folder)
}
```

### LogEntry

```typescript
type LogLevel = "info" | "warning" | "error"

interface LogEntry {
  id: string
  timestamp: string             // ISO date
  level: LogLevel
  message: string
}
```

### EnvVariable

```typescript
interface EnvVariable {
  id: string
  key: string
  value: string
  isRevealed: boolean           // client-side toggle for show/hide
}
```

## State

### ProjectsStoreState

```typescript
type ViewMode = "grid" | "list"
type ProjectFilter = "all" | "deployed" | "generated" | "draft" | "failed"
type ProjectSort = "newest" | "oldest" | "name"

interface ProjectsStoreState {
  // Data
  projects: Project[]
  currentProject: Project | null

  // List state
  searchQuery: string
  filter: ProjectFilter
  sort: ProjectSort
  viewMode: ViewMode
  isLoading: boolean

  // Actions
  loadProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setFilter: (filter: ProjectFilter) => void
  setSort: (sort: ProjectSort) => void
  setViewMode: (mode: ViewMode) => void
  deleteProject: (id: string) => Promise<void>

  // Computed
  getFilteredProjects: () => Project[]
}
```

## Relationships

```
UserProfile (existing)
  └── has many → Project
                   ├── has one → DeploymentInfo (nullable)
                   ├── has many → ProjectFile (tree structure)
                   ├── has many → LogEntry
                   └── has many → EnvVariable
```

## State Transitions

```
Project Status Flow:
  draft → generating → generated → deployed → stopped
                    ↘ failed           ↗
                      (can retry) → generating
```

## Validation Rules

- **Project name**: 1-100 characters, non-empty
- **EnvVariable key**: matches `^[a-zA-Z_][a-zA-Z0-9_-]*$`
- **EnvVariable value**: any string, max 10,000 characters
- **Search query**: any string, max 200 characters
- **Project ID**: UUID format
