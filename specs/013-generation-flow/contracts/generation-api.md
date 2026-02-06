# API Contracts: Generation Flow

**Feature**: 013-generation-flow
**Date**: 2026-02-06
**Note**: For MVP, all APIs are mock implementations with simulated delays. Contracts define the interface for future backend integration.

---

## Mock API Functions (`lib/api/generation.ts`)

### startGeneration

Initiates bot generation process for a project.

```typescript
export async function startGeneration(
  projectId: string,
  config: ConfigFormValues | { freeText: string },
  templateSlug: string
): Promise<StartGenerationResponse>
```

**Mock behavior**: Returns `{ success: true }` after 300ms delay. Actual progress is simulated via `useGeneration` hook.

**Error cases**:
- Insufficient credits: `{ success: false, error: "Insufficient credits" }`
- Invalid config: `{ success: false, error: "Invalid configuration" }`

---

### startDeployment

Initiates deployment of generated bot code.

```typescript
export async function startDeployment(
  projectId: string,
  config: DeployConfig
): Promise<StartDeploymentResponse>
```

**Mock behavior**: Returns `{ success: true }` after 300ms delay. Deployment progress simulated via store.

**Error cases**:
- Invalid bot token: `{ success: false, error: "Invalid bot token format" }`
- No generated code: `{ success: false, error: "No code to deploy" }`

---

### downloadGeneratedCode

Creates a ZIP archive of generated code for client-side download.

```typescript
export async function downloadGeneratedCode(
  files: ProjectFile[]
): Promise<void>
```

**Implementation**: Uses `client-zip` to create ZIP from `ProjectFile[]` array. Triggers browser download. No server round-trip.

---

### getTemplateForProject

Fetches the template associated with a project.

```typescript
export async function getTemplateForProject(
  projectId: string
): Promise<TemplateResponse>
```

**Mock behavior**: Returns a template from `TEMPLATES` array after 300ms delay. Maps project to template by category.

---

## Hook Interface (`lib/generation/use-generation.ts`)

### useGeneration

Custom hook that wraps `useGenerationStore` and provides simulation logic.

```typescript
export function useGeneration(projectId: string): {
  // State (from store)
  generation: GenerationSession
  deployment: DeploymentSession
  formValues: ConfigFormValues
  freeTextInput: string
  template: Template | null

  // Actions
  setFormValues: (values: ConfigFormValues) => void
  setFreeTextInput: (text: string) => void
  startGeneration: () => void
  retryGeneration: () => void
  startDeployment: (config: DeployConfig) => void
  downloadCode: () => Promise<void>

  // Computed
  canGenerate: boolean // form valid AND credits sufficient
  isGenerating: boolean
  isComplete: boolean
  isError: boolean
}
```

**Simulation logic** (inside hook, not exported):
- `startGeneration()` triggers sequential step simulation via `setTimeout`
- Each step: set status to "running", wait 2-5s random, set to "done"
- Progress bar: calculated from completed steps
- On step 3 ("Writing code"): emit mock code snippets for typewriter effect
- After all steps: set `code` with mock `ProjectFile[]`
- 10% random error probability on any step (configurable)

---

## Store Interface (`stores/generation.ts`)

See `data-model.md` for full `GenerationStoreState` interface.

Store is a pure state container. All simulation/business logic lives in `useGeneration` hook.
