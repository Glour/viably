# Implementation Plan: Generation Flow

**Branch**: `013-generation-flow` | **Date**: 2026-02-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-generation-flow/spec.md`

## Summary

Build the generation flow page — the key screen of the Viably platform. A split-view layout with a chat/configuration panel (left) and preview/progress/code panel (right). Users configure bot parameters via a dynamic form (from template configFields) or free text, launch AI generation with real-time progress visualization, review generated code in Monaco editor, and deploy via a multi-phase modal. For MVP, all generation and deployment progress is simulated client-side.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3
**Primary Dependencies**: Next.js 16.1.6, Tailwind CSS v4, shadcn/ui (radix-ui), motion 12.33, zustand 5.x, react-hook-form 7.71+, zod 4.3+, @monaco-editor/react 4.7.0, react-resizable-panels (new), client-zip (new), canvas-confetti (new), prism-react-renderer (new)
**Storage**: localStorage (split ratio persistence), in-memory state (zustand)
**Testing**: Type-check (`tsc --noEmit`), build (`next build`)
**Target Platform**: Web (desktop + mobile responsive, breakpoint md=768px)
**Project Type**: Web application (frontend-only, Next.js App Router)
**Performance Goals**: 60fps divider drag (SC-005), page interactive <2s (SC-003), progress updates <1s (SC-002)
**Constraints**: No backend integration for MVP, all progress simulated, reuse existing code viewer and UI components
**Scale/Scope**: 1 new page, ~15 new components, 1 new store, 1 new hook, 1 new API module, 1 new mock data module, 4 new npm packages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | PASS | Full codebase exploration done: read all existing components, stores, types, patterns, mock data |
| II. Single Source of Truth | PASS | All new types go to `types/index.ts`, reuse existing `ConfigField`, `ProjectFile`, etc. |
| III. Library-First | PASS | 4 libraries selected: react-resizable-panels, client-zip, canvas-confetti, prism-react-renderer. All researched in research.md |
| IV. Code Reuse & DRY | PASS | Reusing CodeViewer, FileTree, Dialog, Form, Tabs, Badge, Button + all shared hooks |
| V. Strict Type Safety | PASS | All types defined in data-model.md, no `any` usage planned |
| VI. Atomic Task Execution | PASS | Tasks designed as independent, committable units |
| VII. Quality Gates | PASS | Type-check + build before every commit |
| VIII. Progressive Specification | PASS | Spec → Plan → Tasks flow followed |
| IX. Error Handling | PASS | Typed error states for generation and deployment, user-friendly messages in Russian |
| X. Observability | N/A | Frontend-only, no server-side logging needed for MVP |
| XI. Accessibility | PASS | Keyboard nav via react-resizable-panels, ARIA labels, min 44px tap targets, reduced motion support |

**Post-Phase 1 re-check**: All gates still pass. No violations needed.

## Project Structure

### Documentation (this feature)

```text
specs/013-generation-flow/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: library decisions, codebase reuse analysis
├── data-model.md        # Phase 1: types, state, transitions
├── quickstart.md        # Phase 1: setup & dev workflow
├── contracts/
│   └── generation-api.md # Phase 1: API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/projects/[id]/generate/
│   └── page.tsx                          # Generation page route
├── components/generation/
│   ├── compact-navbar.tsx                # Slim 48px navbar
│   ├── chat-panel.tsx                    # Left panel wrapper
│   ├── config-form.tsx                   # Dynamic form from template
│   ├── free-text-input.tsx               # Alternative text input
│   ├── preview-panel.tsx                 # Right panel with tabs
│   ├── generation-progress.tsx           # Step-by-step progress
│   ├── code-snippet-animation.tsx        # Typewriter code blocks
│   ├── idle-state.tsx                    # Pre-generation placeholder
│   ├── error-state.tsx                   # Error with retry
│   ├── complete-state.tsx                # Code viewer + action bar
│   ├── deploy-modal.tsx                  # Multi-phase deploy
│   ├── deploy-progress.tsx               # Deploy step list
│   ├── deploy-success.tsx                # Confetti + bot info
│   └── mobile-tabs.tsx                   # Mobile bottom tabs
├── lib/
│   ├── api/generation.ts                 # Mock API layer
│   ├── data/generation.ts                # Mock generated code
│   └── generation/
│       └── use-generation.ts             # Hook with simulation
├── stores/
│   └── generation.ts                     # Zustand store
└── types/
    └── index.ts                          # Appended generation types
```

**Structure Decision**: Follows existing frontend project structure. New components in `components/generation/` (parallel to `components/projects/`, `components/templates/`). New page in App Router at `app/projects/[id]/generate/`. Store, API, and data modules follow established patterns.

## Component Architecture

```
page.tsx (Generation Page)
├── CompactNavbar
│   ├── Logo
│   ├── Project name
│   ├── Credits Badge
│   └── Back Button
│
├── Group (react-resizable-panels) [desktop]
│   ├── Panel (Chat — 40%)
│   │   └── ChatPanel
│   │       ├── Template Info Header (collapsible)
│   │       ├── AI Welcome Message
│   │       ├── ConfigForm (react-hook-form + zod)
│   │       │   ├── Dynamic fields from template.configFields
│   │       │   └── Generate Button (sticky)
│   │       └── FreeTextInput (alternative)
│   │
│   ├── Separator (draggable divider)
│   │
│   └── Panel (Preview — 60%)
│       └── PreviewPanel
│           ├── Tabs: [Preview] [Code] [Logs]
│           │
│           ├── IdleState (status=idle)
│           ├── GenerationProgress (status=generating)
│           │   ├── Step list with status icons
│           │   ├── Progress bar
│           │   └── CodeSnippetAnimation (typewriter)
│           ├── CompleteState (status=complete)
│           │   ├── CodeViewer (reused)
│           │   └── Action bar: Deploy / Download / Preview
│           └── ErrorState (status=error)
│
├── MobileTabs [mobile only, <768px]
│   ├── Chat tab → ChatPanel (full width)
│   └── Preview tab → PreviewPanel (full width)
│
└── DeployModal (overlay)
    ├── Phase 1: Config (token + env vars)
    ├── Phase 2: DeployProgress (steps)
    └── Phase 3: DeploySuccess (confetti) / DeployFailure
```

## Dependency Graph (task ordering)

```
[Types & Store]          [Mock Data]         [New Deps Install]
      │                       │                      │
      └───────┬───────────────┘                      │
              │                                      │
        [API Layer]                                  │
              │                                      │
      ┌───────┴──────┐                              │
      │              │                               │
[Config Form]  [useGeneration Hook] ←────────────────┘
      │              │
      │       ┌──────┼──────────┐
      │       │      │          │
      │  [Progress] [Idle]  [Error]
      │       │
      │  [Code Snippets]
      │       │
      ├───────┘
      │
[Chat Panel]  [Complete State]  [Compact Navbar]
      │              │                │
      │         [Deploy Modal]        │
      │              │                │
      └──────────────┼────────────────┘
                     │
              [Generation Page]
                     │
              [Mobile Adaptation]
```
