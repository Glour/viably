# Data Model: Generation Flow

**Feature**: 013-generation-flow
**Date**: 2026-02-06

---

## New Types (add to `types/index.ts`)

### Generation Session

```typescript
// Generation status for the flow
export type GenerationStatus = "idle" | "generating" | "complete" | "error"

// Individual generation step status
export type GenerationStepStatus = "pending" | "running" | "done" | "error"

// A single step in the generation pipeline
export interface GenerationStep {
  id: string
  name: string
  status: GenerationStepStatus
  duration: number | null // elapsed seconds, null if not started
}

// Generated code output
export interface GeneratedCode {
  files: ProjectFile[] // reuses existing ProjectFile type
  totalFiles: number
  totalLines: number
}

// Full generation session state
export interface GenerationSession {
  status: GenerationStatus
  currentStep: number // index into steps array
  steps: GenerationStep[]
  progress: number // 0-100 overall
  code: GeneratedCode | null
  error: string | null
  startedAt: string | null // ISO timestamp
  completedAt: string | null // ISO timestamp
}
```

### Deployment Session

```typescript
// Deployment status phases
export type DeploymentStatus = "config" | "deploying" | "success" | "failure"

// Deployment step status
export type DeploymentStepStatus = "pending" | "running" | "done" | "error"

// A single step in the deployment pipeline
export interface DeploymentStep {
  id: string
  name: string
  status: DeploymentStepStatus
  duration: number | null
}

// Bot info after successful deployment
export interface DeployedBotInfo {
  username: string // @bot_username
  url: string // https://t.me/bot_username
  status: "running"
}

// Deployment configuration input
export interface DeployConfig {
  botToken: string
  envVars: Record<string, string> // additional env vars from template
}

// Full deployment session state
export interface DeploymentSession {
  status: DeploymentStatus
  steps: DeploymentStep[]
  currentStep: number
  progress: number // 0-100
  botInfo: DeployedBotInfo | null
  error: string | null
}
```

### Config Form

```typescript
// Dynamic form values based on template configFields
export type ConfigFormValues = Record<string, string | string[] | number>
```

### Generation Store

```typescript
export interface GenerationStoreState {
  // Project & template context
  projectId: string | null
  template: Template | null

  // Generation state
  generation: GenerationSession
  deployment: DeploymentSession

  // Config form
  formValues: ConfigFormValues
  freeTextInput: string

  // Actions
  setProjectContext: (projectId: string, template: Template) => void
  setFormValues: (values: ConfigFormValues) => void
  setFreeTextInput: (text: string) => void

  // Generation actions
  startGeneration: () => void
  retryGeneration: () => void
  resetGeneration: () => void

  // Deployment actions
  startDeployment: (config: DeployConfig) => void
  resetDeployment: () => void

  // Internal (called by simulation)
  _updateStep: (stepIndex: number, status: GenerationStepStatus, duration: number | null) => void
  _setProgress: (progress: number) => void
  _completeGeneration: (code: GeneratedCode) => void
  _failGeneration: (error: string) => void
  _updateDeployStep: (stepIndex: number, status: DeploymentStepStatus, duration: number | null) => void
  _completeDeployment: (botInfo: DeployedBotInfo) => void
  _failDeployment: (error: string) => void
}
```

### API Response Types

```typescript
export type StartGenerationResponse =
  | { success: true }
  | { success: false; error: string }

export type StartDeploymentResponse =
  | { success: true }
  | { success: false; error: string }

export type DownloadCodeResponse =
  | { success: true; blob: Blob }
  | { success: false; error: string }
```

---

## Existing Types Reused (no changes)

| Type | Location | Reused For |
|------|----------|------------|
| `Template` | `types/index.ts` | Template context (name, emoji, creditCost, configFields) |
| `ConfigField` | `types/index.ts` | Dynamic form field rendering |
| `ConfigFieldType` | `types/index.ts` | Field type discriminator |
| `ProjectFile` | `types/index.ts` | Generated code file tree structure |
| `LogEntry` | `types/index.ts` | Generation logs in Logs tab |
| `Project` | `types/index.ts` | Project entity reference |
| `ProjectStatus` | `types/index.ts` | Already has "generating" status |
| `UserProfile` | `types/index.ts` | Credit balance check |

---

## State Transitions

### Generation Flow

```
IDLE ──[startGeneration]──> GENERATING ──[all steps done]──> COMPLETE
                                │
                                └──[error occurs]──> ERROR ──[retryGeneration]──> GENERATING
                                                       │
                                                       └──[resetGeneration]──> IDLE
```

### Generation Steps (sequential)

```
1. Analyzing template     (2-3s)
2. Generating architecture (2-4s)
3. Writing code            (3-5s)
4. Code review             (2-3s)
5. Testing                 (2-4s)
6. Finalizing              (1-2s)
```

Each step transitions: `pending → running → done` (or `error`)

### Deployment Flow

```
CONFIG ──[startDeployment]──> DEPLOYING ──[all steps done]──> SUCCESS
                                  │
                                  └──[error occurs]──> FAILURE ──[retry]──> CONFIG
```

### Deployment Steps (sequential)

```
1. Creating GitHub repo    (1-2s)
2. Pushing code            (2-3s)
3. Connecting to Railway   (1-2s)
4. Building container      (5-10s)
5. Starting bot            (2-3s)
6. Health check            (1-2s)
```

---

## Default Values

```typescript
const DEFAULT_GENERATION_STEPS: GenerationStep[] = [
  { id: "analyze", name: "Analyzing template", status: "pending", duration: null },
  { id: "architecture", name: "Generating architecture", status: "pending", duration: null },
  { id: "code", name: "Writing code", status: "pending", duration: null },
  { id: "review", name: "Code review", status: "pending", duration: null },
  { id: "testing", name: "Testing", status: "pending", duration: null },
  { id: "finalize", name: "Finalizing", status: "pending", duration: null },
]

const DEFAULT_DEPLOYMENT_STEPS: DeploymentStep[] = [
  { id: "github", name: "Creating GitHub repo", status: "pending", duration: null },
  { id: "push", name: "Pushing code", status: "pending", duration: null },
  { id: "railway", name: "Connecting to Railway", status: "pending", duration: null },
  { id: "build", name: "Building container", status: "pending", duration: null },
  { id: "start", name: "Starting bot", status: "pending", duration: null },
  { id: "health", name: "Health check", status: "pending", duration: null },
]

const INITIAL_GENERATION: GenerationSession = {
  status: "idle",
  currentStep: 0,
  steps: DEFAULT_GENERATION_STEPS,
  progress: 0,
  code: null,
  error: null,
  startedAt: null,
  completedAt: null,
}

const INITIAL_DEPLOYMENT: DeploymentSession = {
  status: "config",
  steps: DEFAULT_DEPLOYMENT_STEPS,
  currentStep: 0,
  progress: 0,
  botInfo: null,
  error: null,
}
```

---

## Data Flow

```
Template (from templates store/API)
  │
  ├── configFields → ConfigForm (dynamic form rendering)
  │                    │
  │                    └── formValues / freeTextInput → startGeneration()
  │
  └── creditCost → Credit check (from dashboard store user.credits)

Generation Store
  │
  ├── generation.status → Preview Panel state switching
  ├── generation.steps → Progress step list
  ├── generation.progress → Progress bar
  ├── generation.code → CodeViewer (reused component)
  │
  └── deployment → Deploy Modal phases
```
