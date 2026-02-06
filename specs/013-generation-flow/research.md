# Research: Generation Flow

**Feature**: 013-generation-flow
**Date**: 2026-02-06

---

## Library Decisions

### 1. Resizable Split Panels

**Decision**: Use `react-resizable-panels` (latest v4.x)
**Rationale**: Most popular library for React panel layouts (~2.7M weekly downloads), built-in TypeScript, supports min/max size constraints in CSS units (px, %, rem), orientation control, layout persistence via `onLayoutChange`/`defaultLayout`.
**Alternatives considered**:
- `window-splitter` (hipstersmoothie) — newer, fewer adopters
- `re-resizable` (bokuweb) — single element resize, not split layout
- Custom CSS `resize` — insufficient control, no draggable divider

**API** (v4.x):
```tsx
import { Panel, Group, Separator } from "react-resizable-panels"

<Group orientation="horizontal">
  <Panel defaultSize={40} minSize="320px">Left</Panel>
  <Separator />
  <Panel defaultSize={60} minSize="400px">Right</Panel>
</Group>
```

**localStorage persistence**: Use `onLayoutChange` callback to save ratio, `defaultLayout` to restore.

---

### 2. Client-Side ZIP Generation

**Decision**: Use `client-zip`
**Rationale**: Tiny bundle (2.6KB gzipped), 40x faster than JSZip, zero dependencies, pure client-side, TypeScript support, modern streaming API.
**Alternatives considered**:
- `jszip` — 11M downloads but last updated 4 years ago, much larger bundle
- `@zip.js/zip.js` — actively maintained, more features (encryption), but overkill for basic ZIP creation

**API**:
```typescript
import { downloadZip } from "client-zip"

const files = [
  { name: "main.py", input: "print('hello')" },
  { name: "config.py", input: "BOT_TOKEN = '...'" },
]
const blob = await downloadZip(files).blob()
const link = document.createElement("a")
link.href = URL.createObjectURL(blob)
link.download = "bot-code.zip"
link.click()
```

---

### 3. Confetti Animation

**Decision**: Use `canvas-confetti` directly (not the React wrapper)
**Rationale**: Industry standard, lightweight, framework-agnostic, configurable, supports `disableForReducedMotion` for accessibility.
**Alternatives considered**:
- `react-canvas-confetti` — React wrapper, but last updated 2 years ago, potential peer dependency issues with React 19

**API**:
```typescript
import confetti from "canvas-confetti"

confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  disableForReducedMotion: true,
})
```

---

### 4. Syntax Highlighting for Animated Code Snippets

**Decision**: Use `prism-react-renderer` for lightweight animated code blocks during generation progress
**Rationale**: Small bundle (~2KB core), render-props for full flexibility (needed for typewriter animation), supports multiple languages, customizable themes. Monaco is already available for the final code viewer — prism is for the lightweight animated snippets during generation.
**Alternatives considered**:
- `react-shiki` — VS Code quality highlighting but ~700KB-1.2MB bundle, overkill for animated snippets
- `react-syntax-highlighter` — legacy, not actively maintained
- Reuse Monaco — too heavy for small animated snippets (Monaco is 5MB+)

**API**:
```tsx
import { Highlight, themes } from "prism-react-renderer"

<Highlight theme={themes.nightOwl} code={codeSnippet} language="python">
  {({ style, tokens, getLineProps, getTokenProps }) => (
    <pre style={style}>
      {tokens.map((line, i) => (
        <div key={i} {...getLineProps({ line })}>
          {line.map((token, key) => (
            <span key={key} {...getTokenProps({ token })} />
          ))}
        </div>
      ))}
    </pre>
  )}
</Highlight>
```

---

## Existing Codebase Reuse

### Components to Reuse (as-is)

| Component | Path | Usage in Generation Flow |
|-----------|------|--------------------------|
| `CodeViewer` | `components/projects/code-viewer.tsx` | Complete state (FR-012): show generated code with Monaco editor + file tree |
| `FileTree` | `components/projects/file-tree.tsx` | Used by CodeViewer |
| `Dialog` | `components/ui/dialog.tsx` | Deploy modal base |
| `Form` / `FormField` | `components/ui/form.tsx` | Config form fields |
| `Button` | `components/ui/button.tsx` | All buttons (generate, deploy, retry) |
| `Badge` | `components/ui/badge.tsx` | Credit cost badge, status badges |
| `Tabs` | `components/ui/tabs.tsx` | Preview panel tabs (Preview/Code/Logs), mobile navigation |
| `Input` | `components/ui/input.tsx` | Text fields in config form |
| `Select` | `components/ui/select.tsx` | Select fields in config form |
| `Checkbox` | `components/ui/checkbox.tsx` | Multiselect fields in config form |
| `Label` | `components/ui/label.tsx` | Form field labels |
| `Separator` | `components/ui/separator.tsx` | Visual dividers |
| `Shimmer` | `components/ui/shimmer.tsx` | Loading states |
| `GlowOrbs` | `components/ui/glow-orbs.tsx` | Idle state decoration |
| `FadeInUp` | `components/motion/fade-in-up.tsx` | Entry animations |
| `Navbar` | `components/layout/navbar.tsx` | Reference for compact navbar design |

### Hooks to Reuse

| Hook | Path | Usage |
|------|------|-------|
| `useReducedMotion` | `hooks/use-reduced-motion.ts` | Respect animation preferences |
| `useDebounce` | `hooks/use-debounce.ts` | Form input debouncing |
| `useMounted` | `hooks/use-mounted.ts` | Client-side rendering checks |

### Data Patterns to Follow

| Pattern | Path | Usage |
|---------|------|-------|
| Mock API functions | `lib/api/projects.ts` | Generation/deploy mock APIs with setTimeout |
| Mock data arrays | `lib/data/projects.ts` | Mock generated code files, logs |
| Zustand store | `stores/projects.ts` | Generation store pattern |
| Types barrel export | `types/index.ts` | All new types go here |
| Motion variants | `lib/animations.ts` | New animation variants (typewriter, pulse, etc.) |

### Types to Reuse

| Type | Path | Usage |
|------|------|-------|
| `ConfigField` | `types/index.ts` | Template config field definition |
| `ConfigFieldType` | `types/index.ts` | Field type union |
| `Template` | `types/index.ts` | Template with configFields and creditCost |
| `ProjectFile` | `types/index.ts` | File tree structure for generated code |
| `LogEntry` | `types/index.ts` | Log entries for generation logs tab |
| `Project` | `types/index.ts` | Project entity (has status "generating") |
| `ProjectStatus` | `types/index.ts` | Already includes "generating" |

---

## Technical Decisions

### Split View vs Custom Implementation

**Decision**: Use `react-resizable-panels` library
**Rationale**: Handles mouse, touch, keyboard input; min/max constraints; layout persistence — writing this from scratch would be >200 lines of complex event handling code.

### Form Validation Strategy

**Decision**: Use `react-hook-form` + `zod` (already in project)
**Rationale**: Consistent with existing auth forms. Dynamic schema generation from template configFields. `@hookform/resolvers` already installed.

### State Management for Generation

**Decision**: New Zustand store `useGenerationStore` + custom hook `useGeneration`
**Rationale**: Zustand is the project standard. The hook wraps the store and adds simulation logic (setTimeout-based progress). Clean separation: store = state, hook = business logic.

### Mock Generation Progress

**Decision**: setTimeout-based simulation (2-5s per step) with configurable error probability
**Rationale**: Spec explicitly states MVP uses simulated progress. Clean interface ready for WebSocket replacement later.

### Compact Navbar

**Decision**: New component `CompactNavbar` (not modify existing `Navbar`)
**Rationale**: Completely different layout (48px vs 64px, no nav items, project-specific content). Modifying existing navbar would add complexity for a use case limited to the generation page.

### Mobile Breakpoint

**Decision**: Use `md` breakpoint (768px) consistent with existing project patterns
**Rationale**: Existing Navbar already uses `md:` for mobile/desktop switch. Generation page follows the same pattern.

---

## New Dependencies Summary

| Package | Version | Purpose | Bundle Size |
|---------|---------|---------|-------------|
| `react-resizable-panels` | ^4.6.0 | Split view layout | ~113KB unpacked |
| `client-zip` | latest | Client-side ZIP download | 2.6KB gzipped |
| `canvas-confetti` | ^1.9.4 | Deploy success celebration | ~7KB gzipped |
| `prism-react-renderer` | ^2.4.1 | Animated code snippets | ~2KB core |
