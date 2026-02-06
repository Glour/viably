# Frontend Module: Generation Flow

## Описание
**КЛЮЧЕВОЙ ЭКРАН ПЛАТФОРМЫ.** Split view: чат + конфигурация слева, preview/progress/code справа. Пользователь настраивает бота и запускает AI-генерацию.

## Зависимости
- 01-design-system
- 04-templates-gallery (template data, config fields)
- 05-projects (project state management)

## Сложность: ВЫСОКАЯ
## Приоритет: P0 (Must)
## Estimated: 3-4 дня

---

## Задачи

### Task 1: Generation Page Layout
**Файл:** `app/(main)/projects/[id]/generate/page.tsx`
**Описание:** Split view layout с draggable divider

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Compact Navbar: Logo | Project Name | 💎 Credits]         │
├──────────────────────────┬──────────────────────────────────┤
│  CHAT PANEL (40%)        │  PREVIEW PANEL (60%)             │
│                          │                                   │
│  [Scrollable content]    │  [Tabs: Preview | Code | Logs]  │
│                          │                                   │
│  [Input area — sticky    │                                   │
│   bottom]                │                                   │
├──────────────────────────┤                                   │
│  [Draggable divider]     │                                   │
└──────────────────────────┴──────────────────────────────────┘
```

**Compact Navbar:**
- Slim version (48px height instead of 64px)
- Left: Logo (small), Project name
- Right: Credits badge, back button

**Split View:**
- Default ratio: 40/60
- Draggable divider (vertical line, cursor: col-resize, hover highlight)
- Min chat width: 320px, min preview width: 400px
- Persist ratio in localStorage

**Mobile:** Tabs instead of split — [Chat] [Preview] at bottom

**Acceptance Criteria:**
- [ ] Split layout works
- [ ] Draggable divider functional
- [ ] Compact navbar
- [ ] Mobile tabs fallback

### Task 2: Chat Panel — Config Form
**Файл:** `components/generation/chat-panel.tsx`, `components/generation/config-form.tsx`
**Описание:** Левая панель с AI-сообщениями и формой конфигурации

**Structure:**

1. **Template Info Header:**
   - Template emoji + name
   - Credit cost badge: "💎 5 credits"
   - Collapsible

2. **AI Welcome Message (chat bubble):**
   - Avatar: Viably gradient icon
   - "Привет! 👋 Давай настроим твой {template_name}."
   - "Заполни параметры ниже, или просто опиши что нужно своими словами."

3. **Config Form (dynamic fields from template):**
   - Fields rendered based on template.configFields:
     - `text` → Input
     - `textarea` → Textarea (auto-resize)
     - `select` → Select dropdown
     - `multiselect` → Checkbox group
     - `number` → Number input
   - Each field: label, placeholder, required indicator (*), validation
   - Smooth appear animation (staggered)

4. **Generate Button (sticky bottom of form area):**
   - Gradient primary button, full width
   - "🚀 Генерировать (5 кредитов)"
   - Disabled if: form invalid OR insufficient credits
   - Insufficient credits: button shows "Недостаточно кредитов" + "Пополнить →" link below

5. **Free Text Input (below form):**
   - Divider: "── или опиши своими словами ──"
   - Textarea: "Опиши что хочешь получить..."
   - "Отправить ↑" button (small, secondary)
   - This is ALTERNATIVE to form — either fill form OR write description

**Acceptance Criteria:**
- [ ] Dynamic form renders from template config
- [ ] All field types work (text, textarea, select, multiselect, number)
- [ ] Validation (required fields, formats)
- [ ] Credit check on generate button
- [ ] Free text input as alternative
- [ ] Sticky generate button

### Task 3: Preview Panel — States
**Файл:** `components/generation/preview-panel.tsx`
**Описание:** Правая панель с табами, меняет состояние в зависимости от этапа

**Tabs:** [Preview] [Code] [Logs]

**State 1: IDLE (до генерации)**
Tab "Preview" active:
- Centered placeholder
- Large illustration/icon (code brackets or bot icon, muted)
- "Заполни параметры слева и нажми Generate"
- Subtitle: "AI создаст полноценного бота по твоим требованиям"
- Soft glow orb in background

**State 2: GENERATING (во время генерации)**
Tab "Preview" auto-switches to progress view:
- Step-by-step progress list:
  ```
  ✅ Analyzing template          2s
  ✅ Generating architecture     3s
  ● Writing code...             (animated pulse dot)
     [████████░░░░░░░░░░] 45%
  ○ Code review
  ○ Testing
  ○ Finalizing
  ```
- Each step: icon (✅ done, ● current with pulse, ○ pending)
- Current step: animated gradient progress bar below
- Elapsed time per step
- Below progress: animated code blocks appearing (typewriter effect)
  - Show snippets of generated code fading in one by one
  - Dark bg code blocks with syntax highlighting

**State 3: COMPLETE (генерация завершена)**
- Tab "Code" auto-activates
- Full code in Monaco Editor (same as project detail code viewer)
- File tree left, editor right
- Bottom action bar: [🚀 Deploy] (gradient) + [📥 Download ZIP] (secondary) + [👁 Preview] (ghost)

**State 4: ERROR**
- Error icon (red)
- "Что-то пошло не так при генерации"
- Error details (expandable)
- "Кредиты не списаны" reassurance
- [Попробовать снова] (primary) + [Изменить параметры] (secondary)

**Acceptance Criteria:**
- [ ] All 4 states render correctly
- [ ] Smooth transitions between states
- [ ] Progress steps update in real-time
- [ ] Code blocks appear with animation
- [ ] Monaco editor loads on complete
- [ ] Error state with retry

### Task 4: Generation Progress (WebSocket mock)
**Файл:** `lib/generation/use-generation.ts`
**Описание:** Custom hook для управления процессом генерации

**Hook: `useGeneration(projectId: string)`**
```typescript
interface GenerationState {
  status: 'idle' | 'generating' | 'complete' | 'error';
  currentStep: number;
  steps: GenerationStep[];
  progress: number; // 0-100
  code: GeneratedCode | null;
  error: string | null;
}

interface GenerationStep {
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
  duration?: number; // seconds
}

// Steps:
// 1. Analyzing template
// 2. Generating architecture
// 3. Writing code
// 4. Code review
// 5. Testing
// 6. Finalizing
```

**For MVP:** Simulate WebSocket with setTimeout/setInterval:
- Start generation → steps complete one by one (2-5s each)
- Progress bar increments
- After all steps → set code (mock generated code)
- Random chance of "error" state for testing

**Later:** Replace with real WebSocket connection to backend

**Acceptance Criteria:**
- [ ] Hook manages all generation state
- [ ] Simulated progress works
- [ ] Steps update one by one
- [ ] Code is set on completion
- [ ] Error simulation works

### Task 5: Deploy Modal
**Файл:** `components/generation/deploy-modal.tsx`
**Описание:** Modal для деплоя бота (поверх generation page)

**Trigger:** Click "🚀 Deploy" button on completion

**Modal Content (glass card, centered, max-width 520px):**

**Phase 1: Config**
- Title: "🚀 Deploy your bot"
- Description: "Твой {template} будет задеплоен на Railway и начнёт работать в Telegram."
- Input: "Telegram Bot Token" (required, password-style with show/hide)
  - Help link: "Получить у @BotFather →" (opens Telegram)
- Additional env vars (based on template — payment keys etc.)
- Warning: "⚠️ После деплоя бот начнёт использовать ваш Railway аккаунт"
- Buttons: [Отмена] (ghost) + [🚀 Задеплоить] (gradient)
- Divider: "── OR ──"
- [📥 Скачать код (ZIP)] (secondary)

**Phase 2: Progress (modal transforms)**
- Title: "🚀 Deploying {name}..."
- Animated gradient border around modal card
- Steps:
  ```
  ✅ Creating GitHub repo       2s
  ✅ Pushing code                3s
  ✅ Connecting to Railway       1s
  ⏳ Building container...      ~30s
     [████████░░░░░░░░░] 45%
  ○ Starting bot
  ○ Health check
  ```

**Phase 3: Success**
- Title: "🎉 Bot is Live!"
- Confetti animation (canvas-confetti)
- Glow pulse
- Bot info card:
  - 🤖 @bot_username
  - Status: 🟢 Running
  - URL: https://t.me/bot_username
- Buttons: [Открыть в Telegram] (gradient) + [К проектам] (secondary)

**Phase 3b: Failure**
- Title: "❌ Deploy Failed"
- Error details
- [Попробовать снова] + [Скачать код]

**Acceptance Criteria:**
- [ ] 3-phase modal flow
- [ ] Input validation (bot token required)
- [ ] Progress simulation
- [ ] Confetti on success
- [ ] Error handling
- [ ] Download ZIP alternative always available

### Task 6: Mobile Adaptation
**Файл:** Updates to all generation components
**Описание:** Mobile-specific UX для generation flow

**Changes:**
- Split view → Bottom tabs: [💬 Chat] [👁 Preview]
- Chat panel: full width
- Preview panel: full width
- Generate button: floating bottom bar (fixed, gradient, full width)
- Deploy modal: full-screen sheet (slides up from bottom)

**Acceptance Criteria:**
- [ ] Tab switching works on mobile
- [ ] Floating generate button
- [ ] Full-screen deploy sheet
- [ ] All touch-friendly (min 44px tap targets)
