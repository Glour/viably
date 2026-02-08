# Data Model: WebSocket & Generation Flow Integration

**Feature**: 017-websocket-generation
**Date**: 2026-02-07
**Status**: Phase 1 Complete

## Overview

Данная модель описывает структуры данных для WebSocket сообщений, connection state, generation/deploy progress. Все типы будут определены в `frontend/lib/types/websocket.ts` (Single Source of Truth).

## Core Entities

### 1. WebSocket Connection State

**Entity**: `WebSocketConnectionState`

**Description**: Состояние WebSocket соединения с метриками reconnection.

**Fields**:
- `readyState`: `ReadyState` (enum от react-use-websocket)
  - Values: `CONNECTING = 0`, `OPEN = 1`, `CLOSING = 2`, `CLOSED = 3`, `UNINSTANTIATED = -1`
  - Используется для UI logic (disable buttons когда !== OPEN)
- `reconnectAttempts`: `number`
  - Текущее количество попыток переподключения
  - Range: 0-5 (FR-005: max 5 attempts)
- `isConnected`: `boolean` (computed)
  - `true` когда `readyState === ReadyState.OPEN`
- `lastError`: `string | null`
  - Последняя ошибка соединения (для отображения пользователю)

**State Transitions**:
```
UNINSTANTIATED → CONNECTING → OPEN → CLOSING → CLOSED
                      ↑                           ↓
                      └───────── reconnect ───────┘
```

**Validation Rules**:
- `reconnectAttempts` не может превышать 5 (per FR-005)
- `lastError` сбрасывается в `null` при успешном подключении

---

### 2. Generation Progress State

**Entity**: `GenerationProgressState`

**Description**: Полное состояние процесса генерации проекта.

**Fields**:
- `status`: `'idle' | 'generating' | 'complete' | 'error'`
  - Основной статус генерации
  - Initial: `'idle'`
- `currentStep`: `number`
  - Номер текущего шага (1-6)
  - Range: 1-6 (per FR-007)
- `steps`: `GenerationStep[]` (6 элементов)
  - Массив шагов с их статусами
- `progress`: `number`
  - Процент выполнения (0-100)
  - Обновляется от backend через WS
- `codeSnippets`: `string[]`
  - Массив фрагментов кода для typewriter animation
  - Append-only (новые snippets добавляются в конец)
- `generatedCode`: `GeneratedFile[] | null`
  - Финальные файлы после completion
  - `null` пока генерация не завершена
- `error`: `string | null`
  - Сообщение об ошибке (если `status === 'error'`)

**Sub-Entity**: `GenerationStep`

**Fields**:
- `name`: `string`
  - e.g., "Analyzing template", "Generating architecture", etc.
- `status`: `'pending' | 'running' | 'complete' | 'error'`
  - Статус конкретного шага
- `progress`?: `number` (optional)
  - Прогресс внутри шага (0-100)
- `log`?: `string` (optional)
  - Текстовое описание текущего действия
  - e.g., "Generating handlers/shop.py..."

**State Transitions**:
```
idle → generating → complete
           ↓
         error
```

**Validation Rules**:
- `currentStep` всегда в диапазоне 1-6
- `steps.length === 6` (константа)
- `progress` всегда 0-100
- Когда `status === 'complete'`, `generatedCode !== null`
- Когда `status === 'error'`, `error !== null`

---

### 3. Deploy Progress State

**Entity**: `DeployProgressState`

**Description**: Состояние процесса деплоя проекта.

**Fields**:
- `status`: `'idle' | 'deploying' | 'success' | 'error'`
  - Основной статус деплоя
  - Initial: `'idle'`
- `currentStep`: `number`
  - Номер текущего шага (1-6)
  - Range: 1-6 (per FR-008)
- `steps`: `DeployStep[]` (6 элементов)
  - Массив этапов деплоя с их статусами
- `progress`: `number`
  - Процент выполнения (0-100)
- `deploymentInfo`: `DeploymentInfo | null`
  - Информация о задеплоенном проекте
  - Заполняется при `status === 'success'`
- `error`: `string | null`
  - Сообщение об ошибке (если `status === 'error'`)

**Sub-Entity**: `DeployStep`

**Fields**:
- `name`: `string`
  - e.g., "Creating GitHub repo", "Pushing code", etc.
- `status`: `'pending' | 'running' | 'complete' | 'error'`
- `log`?: `string` (optional)
  - Текстовое описание текущего действия

**Sub-Entity**: `DeploymentInfo`

**Fields**:
- `platform`: `string`
  - e.g., "railway"
- `url`: `string`
  - Railway deployment URL
- `botUsername`: `string`
  - Telegram bot username (e.g., "@my_shop_bot")
- `botUrl`: `string`
  - Direct Telegram link (e.g., "https://t.me/my_shop_bot")
- `status`: `'running' | 'stopped'`
  - Текущий статус deployed instance
- `deployedAt`: `string` (ISO 8601 timestamp)
  - Дата и время деплоя

**State Transitions**:
```
idle → deploying → success
           ↓
         error
```

**Validation Rules**:
- `currentStep` всегда в диапазоне 1-6
- `steps.length === 6` (константа)
- `progress` всегда 0-100
- Когда `status === 'success'`, `deploymentInfo !== null`
- Когда `status === 'error'`, `error !== null`

---

### 4. WebSocket Message Types

**Base Entity**: `WebSocketMessage`

**Description**: Discriminated union всех типов WebSocket сообщений от backend.

**Variants**:

#### 4.1. GenerationProgressMessage

**Type**: `'generation_progress'`

**Fields**:
- `type`: `'generation_progress'` (literal)
- `project_id`: `string` (UUID)
- `data`:
  - `step`: `number` (1-6)
  - `step_name`: `string`
  - `step_status`: `'running' | 'complete'`
  - `progress`: `number` (0-100)
  - `log`?: `string`
  - `code_snippet`?: `string`

**Usage**: Обновляет `GenerationProgressState` в реальном времени.

#### 4.2. GenerationCompleteMessage

**Type**: `'generation_complete'`

**Fields**:
- `type`: `'generation_complete'` (literal)
- `project_id`: `string` (UUID)
- `data`:
  - `generated_code`: `GeneratedFile[]`

**Sub-Type**: `GeneratedFile`
- `path`: `string` (relative path)
- `content`: `string` (file contents)
- `language`: `string` (for syntax highlighting)

**Usage**: Финализирует генерацию, загружает код файлы.

#### 4.3. GenerationErrorMessage

**Type**: `'generation_error'`

**Fields**:
- `type`: `'generation_error'` (literal)
- `project_id`: `string` (UUID)
- `data`:
  - `error`: `string` (error message for user)

**Usage**: Переводит `GenerationProgressState.status` в `'error'`.

#### 4.4. DeployProgressMessage

**Type**: `'deploy_progress'`

**Fields**:
- `type`: `'deploy_progress'` (literal)
- `project_id`: `string` (UUID)
- `data`:
  - `step`: `number` (1-6)
  - `step_name`: `string`
  - `step_status`: `'running' | 'complete'`
  - `progress`: `number` (0-100)
  - `log`?: `string`

**Usage**: Обновляет `DeployProgressState` в реальном времени.

#### 4.5. DeployCompleteMessage

**Type**: `'deploy_complete'`

**Fields**:
- `type`: `'deploy_complete'` (literal)
- `project_id`: `string` (UUID)
- `data`: `DeploymentInfo`
  - `platform`: `string`
  - `url`: `string`
  - `bot_username`: `string`
  - `bot_url`: `string`
  - `status`: `'running'`
  - `deployed_at`: `string` (ISO 8601)

**Usage**: Финализирует деплой, показывает bot info + confetti.

#### 4.6. DeployErrorMessage

**Type**: `'deploy_error'`

**Fields**:
- `type`: `'deploy_error'` (literal)
- `project_id`: `string` (UUID)
- `data`:
  - `error`: `string`

**Usage**: Переводит `DeployProgressState.status` в `'error'`.

#### 4.7. CreditsUpdatedMessage

**Type**: `'credits_updated'`

**Fields**:
- `type`: `'credits_updated'` (literal)
- `project_id`: `string` (UUID)
- `data`:
  - `balance`: `number` (new credit balance)

**Usage**: Invalidates React Query credits cache, navbar updates автоматически.

---

### 5. Credit Check Data

**Entity**: `CreditCheckResult`

**Description**: Результат проверки достаточности кредитов перед генерацией.

**Fields**:
- `hasSufficientCredits`: `boolean`
  - `true` если `currentBalance >= requiredCredits`
- `currentBalance`: `number`
  - Текущий баланс пользователя
- `requiredCredits`: `number`
  - Стоимость генерации (from template.creditCost)
- `shortfall`: `number | null`
  - Недостающая сумма (если `hasSufficientCredits === false`)
  - Formula: `requiredCredits - currentBalance` или `null`

**Usage**: В UI для disable/enable кнопки Generate (FR-010, FR-012).

---

## Entity Relationships

```
┌──────────────────────────┐
│ WebSocketConnectionState │
└────────────┬─────────────┘
             │ manages
             ▼
  ┌──────────────────────┐
  │  WebSocketMessage    │──┬──> GenerationProgressMessage
  └──────────────────────┘  ├──> GenerationCompleteMessage
                            ├──> GenerationErrorMessage
                            ├──> DeployProgressMessage
                            ├──> DeployCompleteMessage
                            ├──> DeployErrorMessage
                            └──> CreditsUpdatedMessage

GenerationProgressMessage ──updates──> GenerationProgressState
                                               │ contains
                                               └──> GenerationStep[]

DeployProgressMessage ──updates──> DeployProgressState
                                         │ contains
                                         ├──> DeployStep[]
                                         └──> DeploymentInfo (on success)

CreditsUpdatedMessage ──invalidates──> React Query cache
                                               │
                                               └──> useCreditBalance()
```

## Implementation Notes

### TypeScript Type Definitions

**File**: `frontend/lib/types/websocket.ts`

```typescript
// Re-export from react-use-websocket
export { ReadyState } from 'react-use-websocket'

// === Connection State ===
export interface WebSocketConnectionState {
  readyState: ReadyState
  reconnectAttempts: number
  isConnected: boolean
  lastError: string | null
}

// === Generation Types ===
export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'
export type StepStatus = 'pending' | 'running' | 'complete' | 'error'

export interface GenerationStep {
  name: string
  status: StepStatus
  progress?: number
  log?: string
}

export interface GeneratedFile {
  path: string
  content: string
  language: string
}

export interface GenerationProgressState {
  status: GenerationStatus
  currentStep: number
  steps: GenerationStep[]
  progress: number
  codeSnippets: string[]
  generatedCode: GeneratedFile[] | null
  error: string | null
}

// === Deploy Types ===
export type DeployStatus = 'idle' | 'deploying' | 'success' | 'error'

export interface DeployStep {
  name: string
  status: StepStatus
  log?: string
}

export interface DeploymentInfo {
  platform: string
  url: string
  botUsername: string
  botUrl: string
  status: 'running' | 'stopped'
  deployedAt: string
}

export interface DeployProgressState {
  status: DeployStatus
  currentStep: number
  steps: DeployStep[]
  progress: number
  deploymentInfo: DeploymentInfo | null
  error: string | null
}

// === WebSocket Messages (from backend) ===
export type WebSocketMessage =
  | GenerationProgressMessage
  | GenerationCompleteMessage
  | GenerationErrorMessage
  | DeployProgressMessage
  | DeployCompleteMessage
  | DeployErrorMessage
  | CreditsUpdatedMessage

export interface GenerationProgressMessage {
  type: 'generation_progress'
  project_id: string
  data: {
    step: number
    step_name: string
    step_status: 'running' | 'complete'
    progress: number
    log?: string
    code_snippet?: string
  }
}

export interface GenerationCompleteMessage {
  type: 'generation_complete'
  project_id: string
  data: {
    generated_code: GeneratedFile[]
  }
}

export interface GenerationErrorMessage {
  type: 'generation_error'
  project_id: string
  data: {
    error: string
  }
}

export interface DeployProgressMessage {
  type: 'deploy_progress'
  project_id: string
  data: {
    step: number
    step_name: string
    step_status: 'running' | 'complete'
    progress: number
    log?: string
  }
}

export interface DeployCompleteMessage {
  type: 'deploy_complete'
  project_id: string
  data: DeploymentInfo
}

export interface DeployErrorMessage {
  type: 'deploy_error'
  project_id: string
  data: {
    error: string
  }
}

export interface CreditsUpdatedMessage {
  type: 'credits_updated'
  project_id: string
  data: {
    balance: number
  }
}

// === Credit Check ===
export interface CreditCheckResult {
  hasSufficientCredits: boolean
  currentBalance: number
  requiredCredits: number
  shortfall: number | null
}
```

### Constants

**File**: `frontend/lib/data/generation.ts` (extend existing)

```typescript
import type { GenerationStep, DeployStep } from '@/types/websocket'

export const GENERATION_STEPS: Omit<GenerationStep, 'status'>[] = [
  { name: 'Analyzing template' },
  { name: 'Generating architecture' },
  { name: 'Writing code' },
  { name: 'Code review' },
  { name: 'Testing' },
  { name: 'Finalizing' },
]

export const DEPLOY_STEPS: Omit<DeployStep, 'status'>[] = [
  { name: 'Creating GitHub repo' },
  { name: 'Pushing code' },
  { name: 'Connecting to Railway' },
  { name: 'Building container' },
  { name: 'Starting bot' },
  { name: 'Health check' },
]

export const MAX_RECONNECT_ATTEMPTS = 5
export const INITIAL_RECONNECT_INTERVAL = 3000 // 3s
export const MAX_RECONNECT_INTERVAL = 48000 // 48s
```

## Validation

### Generation Step Validation

```typescript
function validateGenerationStep(step: number): void {
  if (step < 1 || step > 6) {
    throw new Error(`Invalid generation step: ${step}. Must be 1-6.`)
  }
}
```

### Deploy Step Validation

```typescript
function validateDeployStep(step: number): void {
  if (step < 1 || step > 6) {
    throw new Error(`Invalid deploy step: ${step}. Must be 1-6.`)
  }
}
```

### Progress Validation

```typescript
function validateProgress(progress: number): void {
  if (progress < 0 || progress > 100) {
    throw new Error(`Invalid progress: ${progress}. Must be 0-100.`)
  }
}
```

## Summary

- **7 message types** четко определены с TypeScript discriminated unions
- **3 основных state entities**: Connection, Generation, Deploy
- **Все типы централизованы** в `frontend/lib/types/websocket.ts` (Single Source of Truth)
- **Validation rules** документированы для каждой entity
- **Constants** вынесены в отдельный файл для переиспользования
- **State transitions** явно описаны для всех stateful entities
