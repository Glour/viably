# Manual Testing Checklist: WebSocket & Generation Flow

**Feature**: 017-websocket-generation
**Date**: 2026-02-08
**Version**: Phase 9 Complete

---

## Prerequisites

- [ ] Backend server running (`http://localhost:8000`)
- [ ] Frontend server running (`http://localhost:3000`)
- [ ] Valid user account with credits
- [ ] WebSocket server configured and accessible

---

## Test Suite 1: Generation Flow (US1)

### 1.1 Happy Path - Complete Generation

- [ ] Navigate to `/templates`
- [ ] Select a template card
- [ ] Click "Генерировать" button
- [ ] **Verify**: Credit cost displayed on button (e.g., "🚀 Генерировать (50 кредитов)")
- [ ] Fill in project name and description
- [ ] Click "Генерировать" in modal
- [ ] **Verify**: Redirected to `/projects/{id}/generate`
- [ ] **Verify**: Progress bar starts at 0% and increments
- [ ] **Verify**: Steps appear one by one with status icons:
  - Pending: Circle icon (muted)
  - Running: Spinning loader icon (primary)
  - Complete: Check icon (primary)
- [ ] **Verify**: Code snippets appear during generation (step 2+)
- [ ] **Verify**: Smooth progress bar animation (60fps, no jumps)
- [ ] **Verify**: Progress percentage updates smoothly
- [ ] Wait for generation to complete
- [ ] **Verify**: All steps marked complete
- [ ] **Verify**: Progress bar at 100%
- [ ] **Verify**: Final code displayed in Monaco editor
- [ ] **Verify**: "Развернуть" and "Скачать ZIP" buttons enabled

### 1.2 Insufficient Credits

- [ ] Set user balance below template cost (via admin or backend)
- [ ] Navigate to template page
- [ ] **Verify**: Generate button disabled
- [ ] **Verify**: "Недостаточно кредитов" message displayed
- [ ] **Verify**: Link to `/settings/billing` present
- [ ] Click billing link
- [ ] **Verify**: Redirected to billing page

### 1.3 Generation Error

- [ ] Start generation
- [ ] Simulate backend error (e.g., stop backend mid-generation)
- [ ] **Verify**: Error status displayed
- [ ] **Verify**: Failed step marked with X icon (red)
- [ ] **Verify**: Error message shown
- [ ] **Verify**: Toast notification appears
- [ ] **Verify**: Retry button visible
- [ ] Click Retry
- [ ] **Verify**: Generation restarts

---

## Test Suite 2: WebSocket Resilience (US2)

### 2.1 Automatic Reconnection

- [ ] Start generation
- [ ] Disable network (e.g., turn off WiFi or use DevTools offline mode)
- [ ] **Verify**: Reconnection banner appears: "Reconnecting... (attempt 1/5)"
- [ ] **Verify**: Exponential backoff (3s → 6s → 12s → 24s → 48s)
- [ ] Wait 10 seconds
- [ ] Re-enable network
- [ ] **Verify**: "Соединение восстановлено" toast appears
- [ ] **Verify**: Generation continues from last step
- [ ] **Verify**: Progress updates resume

### 2.2 Max Reconnect Attempts

- [ ] Start generation
- [ ] Disable network permanently
- [ ] Wait for 5 reconnect attempts (~3+6+12+24+48 = 93 seconds)
- [ ] **Verify**: Manual reconnect banner appears
- [ ] **Verify**: "Connection lost after 5 attempts" message
- [ ] **Verify**: "Reconnect" button visible
- [ ] Re-enable network
- [ ] Click "Reconnect" button
- [ ] **Verify**: Connection re-established (page refresh)

### 2.3 Normal Closure (Code 1000)

- [ ] Start generation
- [ ] Complete generation
- [ ] Log out user (triggers WebSocket close with code 1000)
- [ ] **Verify**: No reconnection attempts made
- [ ] **Verify**: No error messages

---

## Test Suite 3: Deploy Flow (US3)

### 3.1 Happy Path - Complete Deployment

- [ ] Complete generation (see Test 1.1)
- [ ] Click "Развернуть" button
- [ ] **Verify**: Deploy modal opens (Phase 1: Config)
- [ ] **Verify**: Environment variables form displayed
- [ ] Add env vars: `BOT_TOKEN=123:ABC`, `ADMIN_ID=12345`
- [ ] Click "Начать развёртывание"
- [ ] **Verify**: Phase 2 (Progress) shown
- [ ] **Verify**: Animated gradient border around deploy steps
- [ ] **Verify**: All 6 deploy steps appear
- [ ] **Verify**: Progress bar updates smoothly (60fps)
- [ ] Wait for deployment to complete
- [ ] **Verify**: Phase 3 (Success) shown
- [ ] **Verify**: Confetti animation plays
- [ ] **Verify**: Bot info displayed:
  - Bot username
  - Telegram link (`https://t.me/{botUsername}`)
  - Railway URL
- [ ] **Verify**: "Открыть бота" and "Посмотреть Railway" buttons work
- [ ] Click "Готово"
- [ ] **Verify**: Modal closes

### 3.2 Deploy Error

- [ ] Complete generation
- [ ] Click "Развернуть"
- [ ] Enter invalid env vars (e.g., empty BOT_TOKEN)
- [ ] Start deployment
- [ ] **Verify**: Error phase shown
- [ ] **Verify**: Error message displayed
- [ ] **Verify**: Toast notification appears
- [ ] **Verify**: Retry button visible
- [ ] Click Retry
- [ ] **Verify**: Returns to Phase 1 (Config)

### 3.3 Download ZIP Alternative

- [ ] Complete generation
- [ ] Click "Скачать ZIP" button (without deploying)
- [ ] **Verify**: ZIP file downloads
- [ ] **Verify**: Filename: `{projectName}.zip`
- [ ] Extract ZIP
- [ ] **Verify**: All generated files present

---

## Test Suite 4: Credit Balance Sync (US4)

### 4.1 Multi-Tab Sync

- [ ] Open app in Tab 1
- [ ] Open same app in Tab 2
- [ ] In Tab 1: Start generation
- [ ] **Verify** (Tab 2): Credit balance in navbar updates when generation completes
- [ ] **Verify**: No page refresh needed
- [ ] **Verify**: Balance matches in both tabs

### 4.2 Credits Refunded on Cancellation

- [ ] Note current balance
- [ ] Start generation
- [ ] Cancel mid-generation (see Test 5.1)
- [ ] **Verify**: Balance increases by refunded amount
- [ ] **Verify**: Both tabs show updated balance

---

## Test Suite 5: Generation Cancellation (US5)

### 5.1 Cancel During Generation

- [ ] Start generation
- [ ] Wait for step 2 or 3 (mid-generation)
- [ ] Click "Отменить" button
- [ ] **Verify**: Confirmation prompt (optional)
- [ ] Confirm cancellation
- [ ] **Verify**: Generation stops immediately
- [ ] **Verify**: Toast: "Генерация отменена. Возвращено X кредитов"
- [ ] **Verify**: UI returns to idle state
- [ ] **Verify**: Credit balance updated
- [ ] **Verify**: WebSocket closed gracefully

### 5.2 Cancel Button Disabled After Completion

- [ ] Complete generation
- [ ] **Verify**: Cancel button not visible in complete state

---

## Test Suite 6: Offline Detection (FR-017)

### 6.1 Offline Banner Display

- [ ] Disable network (WiFi off or DevTools offline)
- [ ] **Verify**: Offline banner appears at top of page
- [ ] **Verify**: Banner message: "Вы не в сети. Проверьте подключение к интернету."
- [ ] Re-enable network
- [ ] **Verify**: Banner disappears within 2 seconds

### 6.2 Disabled Mutations When Offline

- [ ] Disable network
- [ ] Navigate to template page
- [ ] Try to click "Генерировать" button
- [ ] **Verify**: Toast notification: "Невозможно начать генерацию: нет интернета"
- [ ] **Verify**: No API call made
- [ ] **Verify**: No error state set

- [ ] Start generation (while online)
- [ ] During generation, disable network
- [ ] Try to cancel generation
- [ ] **Verify**: Toast notification: "Невозможно отменить генерацию: нет интернета"

- [ ] Complete generation (while online)
- [ ] Disable network
- [ ] Try to start deploy
- [ ] **Verify**: Toast notification: "Невозможно начать деплой: нет интернета"

---

## Test Suite 7: Performance & Polish (Phase 9)

### 7.1 Debounced Progress Updates

- [ ] Start generation
- [ ] **Verify**: Progress bar updates smoothly without jitter
- [ ] **Verify**: No excessive re-renders (check React DevTools Profiler)
- [ ] **Verify**: 100ms debounce applied (use console.log if needed)

### 7.2 Memoized Steps Computation

- [ ] Start generation
- [ ] Open React DevTools Profiler
- [ ] **Verify**: Steps array not recreated on every message
- [ ] **Verify**: useMemo dependencies correct

### 7.3 RAF Smooth Progress Bar

- [ ] Start generation
- [ ] **Verify**: Progress percentage counter animates smoothly (not jumping)
- [ ] **Verify**: 60fps animation (use Performance tab)
- [ ] **Verify**: Progress bar width animates smoothly with Motion

### 7.4 Type-Check & Build

- [ ] Run `npm run type-check` in `frontend/`
- [ ] **Verify**: 0 TypeScript errors
- [ ] Run `npm run build` in `frontend/`
- [ ] **Verify**: Build completes successfully
- [ ] **Verify**: No warnings about hydration or dynamic rendering

---

## Test Suite 8: Edge Cases

### 8.1 Rapid Navigation

- [ ] Start generation
- [ ] Immediately navigate to `/dashboard`
- [ ] **Verify**: No WebSocket reconnection attempts
- [ ] **Verify**: No memory leaks (check DevTools Memory)

### 8.2 Multiple Projects

- [ ] Generate Project A
- [ ] Start generating Project B (new tab)
- [ ] **Verify**: Both generations progress independently
- [ ] **Verify**: No message cross-contamination (check project_id filtering)

### 8.3 Out-of-Order Messages

- [ ] Start generation
- [ ] Simulate backend sending step 3 before step 2 (if possible)
- [ ] **Verify**: Console warning: "Ignoring out-of-order message"
- [ ] **Verify**: UI only shows messages in correct order

### 8.4 Unknown Message Types

- [ ] Start generation
- [ ] Simulate backend sending unknown message type (if possible)
- [ ] **Verify**: Console warning logged
- [ ] **Verify**: Generation continues (graceful degradation)
- [ ] **Verify**: No crashes or error states

---

## Browser Compatibility

Test in the following browsers:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS/iOS)
- [ ] Mobile browsers (Chrome Android, Safari iOS)

---

## Performance Metrics

Record the following metrics:

- [ ] Time to first WebSocket message: ______ ms
- [ ] Total generation time (7 steps): ______ seconds
- [ ] Total deployment time (6 steps): ______ seconds
- [ ] Progress bar smoothness: 60fps? Yes/No
- [ ] Memory usage during generation: ______ MB
- [ ] Memory leaks after unmount: None/Found

---

## Sign-Off

**Tester**: ___________________
**Date**: ___________________
**Status**: Pass / Fail / Partial
**Notes**:

---

## Known Issues / Future Improvements

- WebSocket reconnection during deployment not tested (backend support needed)
- Long-running generations (>5 minutes) not tested
- Network partition scenarios (slow 3G) not tested
- Multi-device sync (same user, different devices) not tested

---

**End of Checklist**
