# WebSocket Message Contracts

**Feature**: 017-websocket-generation
**Date**: 2026-02-07
**WebSocket URL**: `ws://localhost:8000/ws/{user_id}?token={jwt}` (development)

## Overview

Данный документ описывает все типы WebSocket сообщений, которые backend отправляет клиенту для generation и deploy progress updates.

## Connection

### URL Format

```
ws://{host}/ws/{user_id}?token={jwt}
```

**Parameters**:
- `user_id` (path parameter) - UUID пользователя
- `token` (query parameter) - JWT access token

**Example**:
```
ws://localhost:8000/ws/550e8400-e29b-41d4-a716-446655440000?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authentication

Backend проверяет JWT token при подключении:
- ✅ Valid token → connection accepted
- ❌ Invalid/expired token → connection refused (HTTP 401)

### Connection Lifecycle

1. **Client initiates connection** после successful `POST /api/projects/{id}/generate` или `POST /api/projects/{id}/deploy`
2. **Backend accepts** и начинает слать progress messages
3. **Client processes messages** в реальном времени
4. **Connection closes**:
   - Normal closure (code 1000): операция завершена, client закрыл соединение
   - Abnormal closure (code 1006): network error, требуется reconnect

---

## Message Format

### Base Structure

Все messages имеют общую структуру:

```typescript
{
  type: string,           // Message type discriminator
  project_id: string,     // UUID проекта (для фильтрации в multi-project scenarios)
  data: object            // Type-specific payload
}
```

### Message Types

Backend отправляет 7 типов сообщений:

1. `generation_progress` - прогресс генерации
2. `generation_complete` - генерация завершена
3. `generation_error` - ошибка генерации
4. `deploy_progress` - прогресс деплоя
5. `deploy_complete` - деплой завершён
6. `deploy_error` - ошибка деплоя
7. `credits_updated` - баланс кредитов обновлён

---

## 1. Generation Progress

**Type**: `generation_progress`

**When**: Отправляется периодически во время генерации (каждые 1-5 секунд в зависимости от активности)

**Message**:
```json
{
  "type": "generation_progress",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "step": 3,
    "step_name": "Writing code",
    "step_status": "running",
    "progress": 45,
    "log": "Generating handlers/shop.py...",
    "code_snippet": "async def handle_catalog(message):\n    items = await db.get_items()\n    ..."
  }
}
```

**Fields**:
- `data.step` (number, 1-6) - Номер текущего шага (см. Generation Steps ниже)
- `data.step_name` (string) - Название шага (human-readable)
- `data.step_status` (enum: "running" | "complete") - Статус текущего шага
  - "running" - шаг выполняется
  - "complete" - шаг завершён, переход к следующему
- `data.progress` (number, 0-100) - Общий прогресс генерации в процентах
- `data.log` (string, optional) - Текстовое описание текущего действия
- `data.code_snippet` (string, optional) - Фрагмент генерируемого кода для preview

**Generation Steps** (6 шагов):
1. Analyzing template
2. Generating architecture
3. Writing code
4. Code review
5. Testing
6. Finalizing

**Client Behavior**:
- Обновить `GenerationProgressState.currentStep` и `progress`
- Если `step_status === "complete"`, пометить шаг как complete в UI
- Если `code_snippet` присутствует, добавить в `codeSnippets[]` для typewriter animation
- Обновить UI в реальном времени (<100ms latency)

---

## 2. Generation Complete

**Type**: `generation_complete`

**When**: Отправляется один раз после успешного завершения всех 6 шагов генерации

**Message**:
```json
{
  "type": "generation_complete",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "generated_code": [
      {
        "path": "handlers/shop.py",
        "content": "from aiogram import Router\n\nasync def handle_catalog(message):\n    ...",
        "language": "python"
      },
      {
        "path": "config.yaml",
        "content": "bot:\n  token: ${TELEGRAM_BOT_TOKEN}\n  parse_mode: HTML",
        "language": "yaml"
      },
      {
        "path": "requirements.txt",
        "content": "aiogram==3.4.1\naiohttp==3.9.1",
        "language": "text"
      }
    ]
  }
}
```

**Fields**:
- `data.generated_code` (array) - Массив всех сгенерированных файлов
  - `path` (string) - Relative path файла в проекте
  - `content` (string) - Полное содержимое файла
  - `language` (string) - Язык программирования для syntax highlighting (e.g., "python", "yaml", "javascript", "text")

**Client Behavior**:
- Обновить `GenerationProgressState.status = 'complete'`
- Сохранить `generatedCode = data.generated_code`
- Показать кнопку "Deploy" и "Download ZIP"
- Отобразить код в Monaco editor
- Invalidate project query в React Query (обновить project status в БД)

---

## 3. Generation Error

**Type**: `generation_error`

**When**: Отправляется если генерация завершилась с ошибкой на любом шаге

**Message**:
```json
{
  "type": "generation_error",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "error": "Failed to generate code: AI service timeout. Your credits have been refunded."
  }
}
```

**Fields**:
- `data.error` (string) - User-facing error message (локализовано на русском)

**Client Behavior**:
- Обновить `GenerationProgressState.status = 'error'`
- Сохранить `error = data.error`
- Показать error message в UI
- Показать кнопку "Retry"
- Invalidate credits query (кредиты возвращены backend автоматически)

---

## 4. Deploy Progress

**Type**: `deploy_progress`

**When**: Отправляется периодически во время деплоя (каждые 2-10 секунд в зависимости от этапа)

**Message**:
```json
{
  "type": "deploy_progress",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "step": 4,
    "step_name": "Building container",
    "step_status": "running",
    "progress": 65,
    "log": "Installing Python dependencies... (aiogram, aiohttp)"
  }
}
```

**Fields**:
- `data.step` (number, 1-6) - Номер текущего этапа (см. Deploy Steps ниже)
- `data.step_name` (string) - Название этапа
- `data.step_status` (enum: "running" | "complete") - Статус текущего этапа
- `data.progress` (number, 0-100) - Общий прогресс деплоя в процентах
- `data.log` (string, optional) - Текстовое описание текущего действия

**Deploy Steps** (6 этапов):
1. Creating GitHub repo
2. Pushing code
3. Connecting to Railway
4. Building container (самый долгий, может занять 2-3 минуты)
5. Starting bot
6. Health check

**Client Behavior**:
- Обновить `DeployProgressState.currentStep` и `progress`
- Если `step_status === "complete"`, пометить этап как complete в UI
- Показать текущий `log` message
- Обновить progress bar

---

## 5. Deploy Complete

**Type**: `deploy_complete`

**When**: Отправляется один раз после успешного завершения всех 6 этапов деплоя и health check прошёл

**Message**:
```json
{
  "type": "deploy_complete",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "platform": "railway",
    "url": "https://my-shop-bot-production.up.railway.app",
    "bot_username": "my_shop_bot",
    "bot_url": "https://t.me/my_shop_bot",
    "status": "running",
    "deployed_at": "2026-02-07T14:35:22Z"
  }
}
```

**Fields**:
- `data.platform` (string) - Платформа деплоя (e.g., "railway")
- `data.url` (string) - Railway deployment URL (для логов, мониторинга)
- `data.bot_username` (string) - Telegram bot username (без @)
- `data.bot_url` (string) - Direct Telegram link для открытия бота
- `data.status` (enum: "running") - Статус deployed instance
- `data.deployed_at` (string, ISO 8601) - Timestamp деплоя

**Client Behavior**:
- Обновить `DeployProgressState.status = 'success'`
- Сохранить `deploymentInfo = data`
- Показать success modal с bot info
- Отобразить кнопку "Open in Telegram" (opens `bot_url`)
- Запустить confetti animation 🎉
- Invalidate project query (обновить deployment status в БД)

---

## 6. Deploy Error

**Type**: `deploy_error`

**When**: Отправляется если деплой завершился с ошибкой на любом этапе

**Message**:
```json
{
  "type": "deploy_error",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "error": "Failed to build container: Missing dependency 'aiohttp'. Please check requirements.txt and try again."
  }
}
```

**Fields**:
- `data.error` (string) - User-facing error message (локализовано на русском)

**Client Behavior**:
- Обновить `DeployProgressState.status = 'error'`
- Сохранить `error = data.error`
- Показать error message в deploy modal
- Показать кнопку "Retry" и "Download ZIP" (alternative option)

---

## 7. Credits Updated

**Type**: `credits_updated`

**When**: Отправляется когда баланс кредитов изменился (списание после generation complete или refund после generation error)

**Message**:
```json
{
  "type": "credits_updated",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "balance": 15
  }
}
```

**Fields**:
- `data.balance` (number) - Новый баланс кредитов пользователя

**Client Behavior**:
- Invalidate React Query credits query: `queryClient.invalidateQueries({ queryKey: ['credits'] })`
- Navbar badge обновится автоматически (через `useCreditBalance` hook)
- Если баланс обновился в другой вкладке, этот message синхронизирует все открытые tabs

---

## Error Scenarios

### Invalid Message Format

Если backend отправляет message с unknown type или invalid structure:

**Client Behavior**:
- Log warning в console: `console.warn('Unknown WebSocket message type:', message.type)`
- НЕ ломать UI (graceful degradation)
- Продолжать обрабатывать следующие messages

**Example**:
```typescript
useEffect(() => {
  if (!lastJsonMessage) return

  const message = lastJsonMessage as WebSocketMessage

  switch (message.type) {
    case 'generation_progress':
      // handle
      break
    // ... other cases
    default:
      console.warn('Unknown WebSocket message type:', message.type)
      // Don't crash - just ignore
  }
}, [lastJsonMessage])
```

### Out-of-Order Messages

Backend гарантирует порядок сообщений, но network issues могут вызвать reordering.

**Client Protection**:
- Проверять `step` number: если новый `step < currentStep`, игнорировать (устаревшее сообщение)
- Проверять `progress`: если новый `progress < currentProgress`, игнорировать

**Example**:
```typescript
if (message.data.step < currentStep) {
  console.warn('Ignoring out-of-order message:', message)
  return
}
```

---

## Connection Management

### Reconnection Scenarios

**Scenario 1: Network interruption**
- WebSocket connection drops (code 1006)
- Client автоматически reconnects с exponential backoff (3s → 6s → 12s → 24s → 48s)
- Backend resends последнее состояние при reconnect
- Client продолжает с того места, где остановился

**Scenario 2: Tab visibility change**
- User переключился на другую вкладку
- Browser может suspend WebSocket
- При возврате: reconnect автоматически (react-use-websocket handles this)

**Scenario 3: Server restart**
- Backend restarts во время активной генерации/деплоя
- Connection closes (code 1001 или 1006)
- Client reconnects
- Backend восстанавливает состояние из БД и продолжает отправлять updates

### Graceful Disconnect

**When Client Should Close Connection**:
1. User cancels generation (`POST /api/projects/{id}/cancel-generation`)
2. User navigates away from page (component unmount)
3. Generation/deploy completed и все messages получены

**Implementation**:
```typescript
// In component cleanup
useEffect(() => {
  return () => {
    // WebSocket auto-closes on unmount (react-use-websocket)
    // No manual action needed
  }
}, [])
```

---

## Message Frequency

**Expected Rates**:

| Message Type | Frequency | Duration |
|--------------|-----------|----------|
| `generation_progress` | 1-5s | 2-5 min total |
| `generation_complete` | Once | - |
| `generation_error` | Once (if error) | - |
| `deploy_progress` | 2-10s | 3-5 min total |
| `deploy_complete` | Once | - |
| `deploy_error` | Once (if error) | - |
| `credits_updated` | On balance change | - |

**Client Optimization**:
- Не re-render UI на каждый progress message (debounce 100ms)
- Batch state updates для smooth animations
- Use `requestAnimationFrame` для progress bar updates

---

## Testing

### Mock WebSocket Server

Для integration tests, использовать mock WebSocket server:

```typescript
// Test helper: frontend/lib/ws/__tests__/mock-ws-server.ts
import { WebSocketServer } from 'ws'

export function createMockWsServer(port: number) {
  const wss = new WebSocketServer({ port })

  return {
    sendMessage: (message: WebSocketMessage) => {
      wss.clients.forEach(client => {
        client.send(JSON.stringify(message))
      })
    },
    close: () => wss.close()
  }
}
```

### Example Test

```typescript
test('handles generation_complete message', async () => {
  const mockServer = createMockWsServer(8001)

  render(<GenerationPage projectId="test-uuid" />)

  mockServer.sendMessage({
    type: 'generation_complete',
    project_id: 'test-uuid',
    data: {
      generated_code: [{ path: 'test.py', content: 'print("hello")', language: 'python' }]
    }
  })

  await waitFor(() => {
    expect(screen.getByText('Generation Complete')).toBeInTheDocument()
  })

  mockServer.close()
})
```

---

## Summary

| Message Type | Frequency | Purpose | Client Action |
|--------------|-----------|---------|---------------|
| `generation_progress` | Periodic (1-5s) | Update progress | Update UI state |
| `generation_complete` | Once | Provide code | Show code editor |
| `generation_error` | Once | Report error | Show error + retry |
| `deploy_progress` | Periodic (2-10s) | Update progress | Update UI state |
| `deploy_complete` | Once | Provide bot info | Show success + confetti |
| `deploy_error` | Once | Report error | Show error + retry |
| `credits_updated` | On change | Sync balance | Invalidate query |

**Key Takeaways**:
- All messages JSON-formatted, self-describing via `type` field
- Client uses discriminated unions для type-safe parsing
- Reconnection handled автоматически by react-use-websocket
- Graceful degradation на unknown/invalid messages
- Progress updates debounced для smooth UX
