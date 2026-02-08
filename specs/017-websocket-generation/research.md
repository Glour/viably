# Research: WebSocket & Generation Flow Integration

**Date**: 2026-02-07
**Feature**: 017-websocket-generation
**Status**: Complete

## Executive Summary

Исследованы существующие библиотеки для WebSocket интеграции в React. **Рекомендация**: использовать `react-use-websocket` - зрелая библиотека с автоматическим reconnection, exponential backoff, TypeScript support и активной поддержкой сообщества.

## Library Research

### Decision: WebSocket Library

**Chosen**: `react-use-websocket` v4.x

**Rationale**:
- ✅ Weekly downloads: 200k+ (высокая популярность)
- ✅ Active maintenance: последний commit <1 месяца назад
- ✅ TypeScript support: full type definitions included
- ✅ Bundle size: 8.4 kB (minified + gzipped) - приемлемо
- ✅ Covers >90% requirements из spec:
  - Automatic reconnection with configurable backoff
  - Connection lifecycle callbacks (onOpen, onClose, onError, onReconnectStop)
  - JSON message parsing built-in (sendJsonMessage, lastJsonMessage)
  - ReadyState enum для отслеживания состояния
  - Support для shared connections (multiple tabs scenario)
  - Heartbeat support (опционально, для keep-alive)
- ✅ Source reputation: High (GitHub stars: 1.2k+)
- ✅ Context7 benchmark score: 96.5/100
- ✅ Хорошая документация с примерами exponential backoff

**Alternatives Considered**:

1. **Native WebSocket API** (встроенный в браузер)
   - ❌ Rejected: Требует ручной реализации reconnection logic (~200 LOC)
   - ❌ No exponential backoff out-of-the-box
   - ❌ Сложнее тестировать
   - ✅ Zero bundle size

2. **reconnecting-websocket** (607 dependents)
   - ❌ Rejected: Lower-level API, требует wrapper для React hooks
   - ❌ Меньше React-specific features
   - ✅ Легковесная (smaller bundle)

3. **Socket.IO client**
   - ❌ Rejected: Backend использует native WebSocket, не Socket.IO protocol
   - ❌ Heavier bundle size (~25kB)
   - ✅ Более rich feature set (rooms, namespaces)

**Implementation Approach**:
- Install `react-use-websocket@^4.8.1` (latest stable)
- Wrap useWebSocket in custom hooks (useGeneration, useDeploy)
- Configure exponential backoff: Math.pow(2, attempt) * 1000, max 48s
- Use onReconnectStop для user notification после 5 failed attempts
- Leverage lastJsonMessage для automatic JSON parsing
- Use ReadyState.OPEN check для UI button disable logic

## Best Practices Research

### WebSocket URL Construction

**Backend contract** (from dependencies):
```
ws://localhost:8000/ws/{user_id}?token={jwt}
```

**Implementation**:
```typescript
const socketUrl = useMemo(() => {
  const user = useUser() // existing hook from module 015
  const token = getAccessToken() // existing function from module 015
  const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

  if (!user || !token) return null
  return `${baseWsUrl}/ws/${user.id}?token=${token}`
}, [user?.id, token])

const { lastJsonMessage, readyState } = useWebSocket(socketUrl, {
  shouldReconnect: (closeEvent) => {
    // Don't reconnect if server explicitly closed (code 1000)
    return closeEvent.code !== 1000
  },
  // ... other options
})
```

### Message Type Handling

**Backend message format** (from spec FR-002):
```typescript
type WebSocketMessage =
  | { type: 'generation_progress'; project_id: string; data: GenerationProgressData }
  | { type: 'generation_complete'; project_id: string; data: GenerationCompleteData }
  | { type: 'generation_error'; project_id: string; data: { error: string } }
  | { type: 'deploy_progress'; project_id: string; data: DeployProgressData }
  | { type: 'deploy_complete'; project_id: string; data: DeploymentInfo }
  | { type: 'deploy_error'; project_id: string; data: { error: string } }
  | { type: 'credits_updated'; project_id: string; data: { balance: number } }
```

**Best practice**: Use discriminated union types + switch statement для type-safe message handling.

### State Management Integration

**Approach**: React Query invalidation на completion events

```typescript
const queryClient = useQueryClient()

useEffect(() => {
  if (!lastJsonMessage) return

  switch (lastJsonMessage.type) {
    case 'generation_complete':
      // Invalidate project query to refetch status
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      break
    case 'credits_updated':
      // Invalidate credits query
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      break
  }
}, [lastJsonMessage, queryClient, projectId])
```

**Rationale**: Следует existing pattern из module 016 (data-hooks). React Query уже настроен, queries already defined.

### Graceful Disconnect on Unmount

**Best practice** (из Context7 docs):
```typescript
const didUnmount = useRef(false)

useEffect(() => {
  return () => {
    didUnmount.current = true
  }
}, [])

const { ... } = useWebSocket(socketUrl, {
  shouldReconnect: (closeEvent) => {
    // Don't reconnect if component unmounted
    return didUnmount.current === false && closeEvent.code !== 1000
  }
})
```

**Rationale**: Предотвращает reconnection attempts после unmount компонента. react-use-websocket автоматически закрывает connection при unmount, но shouldReconnect может триггернуться до cleanup.

## REST Endpoint Integration

**Required endpoints** (для control operations):

1. **POST /api/projects/:id/generate**
   - Body: `{ config: ProjectConfig }`
   - Response: `202 Accepted`
   - Triggers backend to start generation + WS events

2. **POST /api/projects/:id/cancel-generation**
   - Response: `200 OK`
   - Triggers backend to stop generation + close WS

3. **POST /api/projects/:id/deploy**
   - Body: `{ platform: 'railway', env_variables: Record<string, string> }`
   - Response: `202 Accepted`
   - Triggers backend to start deploy + WS events

**Implementation**: Extend existing `frontend/lib/api/generation.ts` with new functions using `api` client from module 015.

## Offline Detection

**Requirement** (FR-017): Detect offline state and show banner.

**Approach**: Navigator.onLine API + event listeners
```typescript
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
```

**Integration with WebSocket**: react-use-websocket автоматически пытается reconnect при возвращении online. Дополнительная логика не требуется.

## Testing Strategy

**Unit Tests** (для WebSocket wrapper):
- Mock useWebSocket from 'react-use-websocket'
- Test message parsing logic
- Test state transitions (idle → generating → complete/error)
- Test query invalidation на completion events

**Integration Tests**:
- Mock WebSocket server (using Mock Service Worker или ws library)
- Test full flow: startGeneration → WS messages → UI updates
- Test reconnection scenarios
- Test graceful disconnect

**Tool**: NEEDS CLARIFICATION - проект использует Vitest? Или другой test runner?

## Summary of Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| WebSocket Library | react-use-websocket v4.8+ | Active maintenance, TS support, covers >90% requirements |
| Custom Implementation | None | Library provides all needed features |
| State Management | React Query invalidation | Follows existing pattern from module 016 |
| Message Parsing | Built-in lastJsonMessage | Automatic JSON parsing, type-safe |
| Reconnection | Exponential backoff 1s-48s | Best practice for production apps |
| Max Reconnects | 5 attempts | Per spec FR-005 |
| Offline Detection | Navigator.onLine | Standard browser API, lightweight |
| Testing | NEEDS CLARIFICATION | Requires project test framework info |

## Open Questions

1. **Testing Framework**: Проект использует Vitest, Jest, или другой test runner? (Нужно для написания unit tests)
2. **Error Tracking**: Использовать ли Sentry или другой service для логирования WS errors в production?
3. **Heartbeat**: Нужен ли heartbeat/ping-pong для keep-alive? (Backend может закрывать idle connections)

## Next Steps (Phase 1)

1. ✅ Library research complete
2. → Create data-model.md (define TypeScript types for WS messages)
3. → Create contracts/ (document WS message formats + REST endpoints)
4. → Create quickstart.md (developer guide for using WebSocket hooks)
5. → Update agent context with new tech stack

## References

- [react-use-websocket npm](https://www.npmjs.com/package/react-use-websocket)
- [react-use-websocket GitHub](https://github.com/robtaussig/reconnecting-websocket)
- [WebSocket MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Context7 Documentation](https://context7.com/robtaussig/react-use-websocket/llms.txt)
