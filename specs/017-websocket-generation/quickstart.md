# Quickstart: WebSocket & Generation Flow Integration

**Feature**: 017-websocket-generation
**Date**: 2026-02-07
**Target Audience**: Frontend developers working on generation/deploy features

## Overview

Данное руководство поможет быстро начать работу с WebSocket интеграцией для real-time generation и deploy progress. Вы узнаете, как:
- Подключаться к WebSocket серверу
- Обрабатывать различные типы сообщений
- Интегрировать с React Query для state management
- Использовать готовые hooks для generation/deploy

---

## Prerequisites

Убедитесь что у вас установлены зависимости:

```bash
cd frontend
npm install react-use-websocket@^4.8.1
```

Также нужны existing модули:
- ✅ Module 015: API client с auth (уже установлен)
- ✅ Module 016: React Query hooks (уже установлен)
- ✅ Module 013: Generation UI components (уже установлены)

---

## Quick Start (5 минут)

### Step 1: Import Types

```typescript
// frontend/lib/types/websocket.ts
import type {
  WebSocketMessage,
  GenerationProgressState,
  DeployProgressState,
  ReadyState
} from '@/types/websocket'
```

Все типы уже определены в `lib/types/websocket.ts` (см. `data-model.md`).

### Step 2: Use Generation Hook

```typescript
// В компоненте страницы проекта
import { useGeneration } from '@/lib/hooks/use-generation'

function ProjectPage({ projectId }: { projectId: string }) {
  const {
    status,
    currentStep,
    steps,
    progress,
    codeSnippets,
    generatedCode,
    error,
    startGeneration,
    cancelGeneration,
    retryGeneration
  } = useGeneration(projectId)

  const handleGenerate = async () => {
    await startGeneration({
      template_id: selectedTemplate.id,
      name: projectName,
      description: projectDescription,
      features: selectedFeatures
    })
  }

  return (
    <div>
      {status === 'idle' && (
        <button onClick={handleGenerate}>Generate</button>
      )}

      {status === 'generating' && (
        <div>
          <p>Step {currentStep}/6: {steps[currentStep - 1].name}</p>
          <progress value={progress} max={100} />
        </div>
      )}

      {status === 'complete' && (
        <div>
          <h3>Generation Complete!</h3>
          <CodeEditor files={generatedCode} />
        </div>
      )}

      {status === 'error' && (
        <div>
          <p>Error: {error}</p>
          <button onClick={retryGeneration}>Retry</button>
        </div>
      )}
    </div>
  )
}
```

### Step 3: Use Deploy Hook

```typescript
import { useDeploy } from '@/lib/hooks/use-deploy'

function DeployModal({ projectId }: { projectId: string }) {
  const {
    status,
    currentStep,
    steps,
    progress,
    deploymentInfo,
    error,
    startDeploy,
    retryDeploy
  } = useDeploy(projectId)

  const handleDeploy = async (envVars: Record<string, string>) => {
    await startDeploy(envVars)
  }

  return (
    <div>
      {status === 'deploying' && (
        <div>
          <p>Step {currentStep}/6: {steps[currentStep - 1].name}</p>
          <progress value={progress} max={100} />
        </div>
      )}

      {status === 'success' && (
        <div>
          <h3>Deploy Complete! 🎉</h3>
          <p>Bot: <a href={deploymentInfo.botUrl}>{deploymentInfo.botUsername}</a></p>
          <p>Railway: <a href={deploymentInfo.url}>View Logs</a></p>
        </div>
      )}
    </div>
  )
}
```

**Готово!** Hooks автоматически:
- ✅ Устанавливают WebSocket соединение
- ✅ Обрабатывают reconnection с exponential backoff
- ✅ Парсят messages и обновляют state
- ✅ Invalidate React Query cache при completion

---

## Architecture Overview

```
┌─────────────────────────┐
│   React Component       │
│   (ProjectPage)         │
└───────────┬─────────────┘
            │ uses
            ▼
┌─────────────────────────┐
│  useGeneration Hook     │ ◀─── You interact with this
│  (lib/hooks/)           │
└───────────┬─────────────┘
            │ uses
            ▼
┌─────────────────────────┐
│  useWebSocket           │ ◀─── react-use-websocket
│  (react-use-websocket)  │
└───────────┬─────────────┘
            │ manages
            ▼
┌─────────────────────────┐
│  WebSocket Connection   │
│  ws://backend/ws/...    │
└───────────┬─────────────┘
            │ receives
            ▼
┌─────────────────────────┐
│  WebSocket Messages     │
│  (generation_progress,  │
│   generation_complete)  │
└─────────────────────────┘
```

**Separation of Concerns**:
- **Components**: UI rendering, user interactions
- **Custom Hooks** (`useGeneration`, `useDeploy`): Business logic, state management
- **react-use-websocket**: Low-level WebSocket management, reconnection
- **Backend**: Generation/deploy execution, progress events

---

## Detailed Examples

### Example 1: Pre-Generation Credit Check

```typescript
import { useCreditBalance } from '@/lib/hooks/use-credits'

function GenerateButton({ templateCost }: { templateCost: number }) {
  const { data: balance, isLoading } = useCreditBalance()

  const hasSufficientCredits = balance !== undefined && balance >= templateCost

  return (
    <button disabled={!hasSufficientCredits || isLoading}>
      {hasSufficientCredits
        ? `🚀 Генерировать (${templateCost} кредитов)`
        : `Недостаточно кредитов (${balance}/${templateCost})`
      }
    </button>
  )
}
```

**How it works**:
- `useCreditBalance` использует React Query для fetch баланса
- При generation complete, WebSocket отправляет `credits_updated` message
- Hook автоматически invalidates query → UI updates

### Example 2: Code Snippets with Typewriter Animation

```typescript
import { useTypewriter } from '@/lib/hooks/use-typewriter'

function CodePreview({ snippets }: { snippets: string[] }) {
  const displayedCode = useTypewriter(snippets.join('\n'), {
    speed: 50 // ms per character
  })

  return (
    <pre className="code-preview">
      <code>{displayedCode}</code>
    </pre>
  )
}
```

**How it works**:
- WebSocket messages содержат `code_snippet` field
- `useGeneration` accumulates их в `codeSnippets` array
- `useTypewriter` анимирует отображение для visual appeal

### Example 3: Multi-Tab Synchronization

```typescript
// Tab 1: User starts generation
const { startGeneration } = useGeneration(projectId)
await startGeneration(config)

// Tab 2: Automatically receives updates via shared WebSocket
// react-use-websocket's `share: true` option enables this
```

**Configuration** (в `useGeneration` hook):
```typescript
const { lastJsonMessage } = useWebSocket(socketUrl, {
  share: true,  // ← Enable multi-tab sync
  shouldReconnect: () => true
})
```

**Result**: Все открытые tabs видят один и тот же progress в реальном времени.

### Example 4: Offline Detection & Banner

```typescript
function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="offline-banner">
      ⚠️ Нет подключения к интернету
    </div>
  )
}
```

**How it works**:
- `navigator.onLine` + event listeners detect network status
- react-use-websocket автоматически reconnects при восстановлении соединения
- No additional code needed в generation hooks

---

## Common Patterns

### Pattern 1: Graceful Error Handling

```typescript
const { status, error, retryGeneration } = useGeneration(projectId)

useEffect(() => {
  if (status === 'error') {
    // Log to error tracking service (optional)
    console.error('Generation failed:', error)

    // Show toast notification
    toast.error(error, {
      action: {
        label: 'Retry',
        onClick: retryGeneration
      }
    })
  }
}, [status, error, retryGeneration])
```

### Pattern 2: Debounced Progress Updates

```typescript
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'

function ProgressBar({ progress }: { progress: number }) {
  // Debounce для smooth animation (избегаем flickering)
  const debouncedProgress = useDebouncedValue(progress, 100)

  return (
    <motion.div
      style={{ width: `${debouncedProgress}%` }}
      transition={{ duration: 0.3 }}
      className="progress-bar"
    />
  )
}
```

### Pattern 3: Conditional WebSocket Connection

```typescript
// Don't connect unless user is on generation page
const { status } = useGeneration(projectId, {
  shouldConnect: pathname === `/projects/${projectId}/generate`
})
```

**Rationale**: Экономит ресурсы, не открывает connection на страницах где он не нужен.

---

## Testing

### Unit Testing: Mock useWebSocket

```typescript
import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useGeneration } from '@/lib/hooks/use-generation'

vi.mock('react-use-websocket', () => ({
  useWebSocket: vi.fn(() => ({
    lastJsonMessage: null,
    readyState: 1, // OPEN
    sendMessage: vi.fn()
  }))
}))

test('initializes with idle status', () => {
  const { result } = renderHook(() => useGeneration('test-id'))

  expect(result.current.status).toBe('idle')
  expect(result.current.progress).toBe(0)
})
```

### Integration Testing: Mock WebSocket Server

```typescript
import { WebSocketServer } from 'ws'
import { render, waitFor } from '@testing-library/react'

test('handles generation_complete message', async () => {
  // Setup mock WS server
  const wss = new WebSocketServer({ port: 8001 })

  render(<ProjectPage projectId="test-id" />)

  // Simulate backend message
  wss.clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'generation_complete',
      project_id: 'test-id',
      data: { generated_code: [...] }
    }))
  })

  await waitFor(() => {
    expect(screen.getByText('Generation Complete')).toBeInTheDocument()
  })

  wss.close()
})
```

---

## Troubleshooting

### Issue 1: WebSocket Connection Refused

**Symptom**: `useWebSocket` returns `readyState: CLOSED`, connection never opens

**Possible Causes**:
1. Backend WebSocket server не запущен
2. Invalid JWT token
3. Incorrect WebSocket URL

**Solution**:
```typescript
// Check WebSocket URL
const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
console.log('Connecting to:', `${socketUrl}/ws/${userId}?token=${token}`)

// Verify token is valid
const token = getAccessToken()
if (!token) {
  console.error('No access token available')
}
```

### Issue 2: Messages Not Received

**Symptom**: WebSocket connected (`readyState: OPEN`) но `lastJsonMessage` остаётся `null`

**Possible Causes**:
1. Backend не отправляет messages для этого `project_id`
2. Messages filtered out by custom `filter` function
3. Generation/deploy ещё не started на backend

**Solution**:
```typescript
// Add debug logging
const { lastJsonMessage } = useWebSocket(socketUrl, {
  onMessage: (event) => {
    console.log('Raw message:', event.data)
  }
})

// Verify generation started
await startGeneration(config)  // This triggers backend to start sending messages
```

### Issue 3: Reconnection Loop

**Symptom**: WebSocket постоянно reconnects/disconnects (loop)

**Possible Causes**:
1. Backend immediately closes connection after accept (authentication issue)
2. `shouldReconnect` returns `true` even for normal closures (code 1000)

**Solution**:
```typescript
const { ... } = useWebSocket(socketUrl, {
  shouldReconnect: (closeEvent) => {
    // Don't reconnect on normal closure
    if (closeEvent.code === 1000) return false

    // Don't reconnect if component unmounted
    if (didUnmount.current) return false

    return true
  }
})
```

---

## Performance Considerations

### 1. Avoid Re-renders on Every Message

❌ **Bad**: Re-render на каждый `generation_progress` (1-5s interval)
```typescript
// This triggers re-render on EVERY WebSocket message
const { lastJsonMessage } = useWebSocket(socketUrl)
```

✅ **Good**: Debounce state updates
```typescript
const [progress, setProgress] = useState(0)

useEffect(() => {
  if (lastJsonMessage?.type === 'generation_progress') {
    // Only update every 100ms
    const timeoutId = setTimeout(() => {
      setProgress(lastJsonMessage.data.progress)
    }, 100)

    return () => clearTimeout(timeoutId)
  }
}, [lastJsonMessage])
```

### 2. Memoize Expensive Computations

```typescript
const generationSteps = useMemo(() => {
  return GENERATION_STEPS.map((step, index) => ({
    ...step,
    status: index < currentStep ? 'complete'
          : index === currentStep ? 'running'
          : 'pending'
  }))
}, [currentStep])
```

### 3. Use React Query для Caching

```typescript
// Don't fetch project code on every render
const { data: generatedCode } = useQuery({
  queryKey: ['project-code', projectId],
  queryFn: () => getProjectCode(projectId),
  enabled: status === 'complete',
  staleTime: Infinity  // Code doesn't change once generated
})
```

---

## Best Practices

### ✅ DO

1. **Always check `readyState` before sending**:
   ```typescript
   if (readyState === ReadyState.OPEN) {
     sendMessage('...')
   }
   ```

2. **Use discriminated unions для type safety**:
   ```typescript
   switch (message.type) {
     case 'generation_progress':
       // TypeScript knows message.data has progress field
       break
   }
   ```

3. **Invalidate React Query cache на completion**:
   ```typescript
   case 'generation_complete':
     queryClient.invalidateQueries({ queryKey: ['project', projectId] })
     break
   ```

4. **Handle graceful disconnect**:
   ```typescript
   useEffect(() => {
     return () => {
       didUnmount.current = true
     }
   }, [])
   ```

### ❌ DON'T

1. **Don't send messages на каждый keystroke**:
   ```typescript
   // Bad: Sends WS message on every input change
   onChange={(e) => sendMessage(e.target.value)}

   // Good: Debounce user input
   const debouncedValue = useDebouncedValue(inputValue, 500)
   useEffect(() => {
     if (debouncedValue) sendMessage(debouncedValue)
   }, [debouncedValue])
   ```

2. **Don't ignore connection errors**:
   ```typescript
   // Bad: No error handling
   const { ... } = useWebSocket(socketUrl)

   // Good: Handle errors gracefully
   const { ... } = useWebSocket(socketUrl, {
     onError: (event) => {
       console.error('WebSocket error:', event)
       toast.error('Connection error. Retrying...')
     }
   })
   ```

3. **Don't forget to cleanup**:
   ```typescript
   // Bad: Event listeners leak
   window.addEventListener('online', handleOnline)

   // Good: Cleanup in useEffect return
   useEffect(() => {
     window.addEventListener('online', handleOnline)
     return () => window.removeEventListener('online', handleOnline)
   }, [])
   ```

---

## Next Steps

1. **Read Full Documentation**:
   - `data-model.md` - Полные type definitions
   - `contracts/websocket-messages.md` - Все message types
   - `contracts/rest-api.md` - REST endpoints

2. **Explore Examples**:
   - `frontend/components/generation/` - Existing UI components
   - `frontend/lib/hooks/` - Existing hooks patterns

3. **Run Tests**:
   ```bash
   cd frontend
   npm run test:ws  # WebSocket integration tests
   ```

4. **Start Development**:
   ```bash
   npm run dev  # Frontend
   # Backend должен быть запущен на localhost:8000
   ```

---

## Support

Если возникли вопросы:
1. Check `troubleshooting` section выше
2. Review contracts в `/contracts/` directory
3. Ask в team Slack channel

**Happy Coding!** 🚀
