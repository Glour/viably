# API Contracts: Projects List & Detail Pages

**Branch**: `012-projects-pages` | **Date**: 2026-02-06

> **Note**: This is an MVP with mock data. These contracts define the mock API function signatures that will later be replaced with real API calls.

## Mock API Functions

### `getProjects(): Promise<ProjectsResponse>`

Returns all projects for the current user.

**Response type**:
```typescript
type ProjectsResponse =
  | { success: true; projects: Project[] }
  | { success: false; error: string }
```

**Mock behavior**: Returns 6-8 mock projects with varied statuses after 800ms delay.

---

### `getProjectById(id: string): Promise<ProjectResponse>`

Returns a single project with full details (files, logs, env vars, deployment info).

**Response type**:
```typescript
type ProjectResponse =
  | { success: true; project: Project }
  | { success: false; error: string }
```

**Mock behavior**: Returns matching project with mock files, logs, and env vars after 500ms delay. Returns `{ success: false, error: "Project not found" }` for unknown IDs.

---

### `deleteProject(id: string): Promise<DeleteProjectResponse>`

Deletes a project by ID.

**Response type**:
```typescript
type DeleteProjectResponse =
  | { success: true }
  | { success: false; error: string }
```

**Mock behavior**: Removes project from mock store, shows success toast after 500ms delay.

---

### `duplicateProject(id: string): Promise<DuplicateProjectResponse>`

Duplicates a project (MVP: toast only).

**Response type**:
```typescript
type DuplicateProjectResponse =
  | { success: true; projectId: string }
  | { success: false; error: string }
```

**Mock behavior**: Shows "Project duplicated" toast. Does not actually create a duplicate in MVP.

---

### `updateProjectEnvVars(id: string, envVars: EnvVariable[]): Promise<UpdateEnvVarsResponse>`

Updates environment variables for a project (MVP: local state only).

**Response type**:
```typescript
type UpdateEnvVarsResponse =
  | { success: true }
  | { success: false; error: string }
```

**Mock behavior**: Updates local state, shows success toast.

---

### `toggleProjectStatus(id: string, action: "start" | "stop"): Promise<ToggleStatusResponse>`

Starts or stops a project's bot (MVP: local state only).

**Response type**:
```typescript
type ToggleStatusResponse =
  | { success: true; newStatus: ProjectStatus }
  | { success: false; error: string }
```

**Mock behavior**: Toggles between "deployed" and "stopped" status in local state.

## Page Routes

| Route | Page | Query Params |
|-------|------|-------------|
| `/projects` | Projects list | — |
| `/projects/[id]` | Project detail | `?tab=overview\|code\|logs\|settings` |
