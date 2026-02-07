# Implementation Plan: WebSocket & Generation Flow Integration

**Branch**: `017-websocket-generation` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-websocket-generation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Replace mock setTimeout-based generation progress with real-time WebSocket connection for generation and deployment workflows. Implement resilient WebSocket client with auto-reconnect, integrate with existing React Query data layer, and connect UI components to real backend events.

Primary technical approach (from Phase 0 research):
- ✅ Use react-use-websocket v4.8+ library (instead of custom wrapper)
- ✅ Integrate with existing @tanstack/react-query for state invalidation
- ✅ Build custom hooks (useGeneration, useDeploy) wrapping WebSocket state
- ✅ Leverage existing ky HTTP client for REST endpoints (start/cancel operations)

## Technical Context

**Language/Version**: TypeScript 5.x / React 19.2.3 / Next.js 16.1.6
**Primary Dependencies**: @tanstack/react-query ^5.90, ky ^1.14, zustand ^5.0, react-use-websocket ^4.8
**Storage**: Client-side only (React Query cache, localStorage for reconnection state)
**Testing**: NEEDS CLARIFICATION (Vitest для unit tests WebSocket wrapper?)
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: web (frontend only - backend WebSocket server already exists)
**Performance Goals**:
  - WebSocket message latency <500ms
  - Reconnection within 3-48s (exponential backoff)
  - UI updates within 100ms of message receipt
  - Support 10+ concurrent WebSocket connections (multiple tabs)
**Constraints**:
  - Must work with existing auth system (JWT tokens from module 015)
  - Must integrate with existing React Query setup (module 016)
  - Must preserve mock UI components structure (module 013)
  - Cannot modify backend WebSocket server
**Scale/Scope**:
  - 1 new WebSocket client class (~200 LOC)
  - 2 new hooks (useGeneration, useDeploy) (~300 LOC each)
  - 7 WebSocket message types to handle
  - 6 generation steps + 6 deploy steps UI states
  - Integration with 4 existing UI components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gates (Phase 0)

- [X] **Context-First Development**: Reviewed existing code in `frontend/lib/api/`, `frontend/lib/hooks/`, `frontend/components/generation/`
- [X] **Single Source of Truth**: Plan identified central locations for WebSocket types (`lib/types/websocket.ts`) and message mappers (`lib/api/mappers.ts`)
- [ ] **Library-First Development**: BLOCKED - Must complete Phase 0 research before confirming library decisions
- [X] **Code Reuse**: Identified existing patterns to extend (ky client, React Query hooks, existing generation UI components)
- [X] **Strict Type Safety**: TypeScript strict mode already enforced in `tsconfig.json`
- [X] **Atomic Task Execution**: Plan structured as independent, testable tasks
- [X] **Quality Gates**: Type-check, build validation required before commits
- [X] **Progressive Specification**: Following spec → plan → tasks → implement flow

### Post-Design Gates (Phase 1) - ✅ RE-CHECKED

- [X] **Single Source of Truth**: All WebSocket types centralized in `lib/types/websocket.ts` (see data-model.md)
- [X] **Library-First**: Library decision documented in research.md (react-use-websocket chosen, alternatives evaluated)
- [X] **Code Reuse**: Extends existing patterns (ky client, React Query hooks, existing UI components)
- [X] **Type Safety**: All WebSocket message handlers typed with discriminated unions (see contracts/websocket-messages.md)

### Gate Status: ✅ PASSED (All Phases)

All constitution gates passed. Ready for Phase 2 (tasks generation).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── research/            # Complex research (if needed - for deep research tasks)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── lib/
│   ├── ws/
│   │   └── websocket-client.ts           # NEW: WebSocket wrapper with reconnect
│   ├── hooks/
│   │   ├── use-generation.ts             # MODIFIED: Replace mock with real WS
│   │   ├── use-deploy.ts                 # NEW: Deploy flow hook
│   │   ├── use-credits.ts                # EXISTING: Already implemented
│   │   └── use-projects.ts               # EXISTING: Already implemented
│   ├── api/
│   │   ├── client.ts                     # EXISTING: ky HTTP client with auth
│   │   ├── generation.ts                 # MODIFIED: Add startGeneration, cancelGeneration endpoints
│   │   ├── mappers.ts                    # MODIFIED: Add WS message mappers
│   │   └── query-keys.ts                 # MODIFIED: Add generation/deploy query keys
│   └── types/
│       └── websocket.ts                  # NEW: WebSocket message types
├── components/
│   └── generation/
│       ├── chat-panel.tsx                # MODIFIED: Connect to real useGeneration
│       ├── preview-panel.tsx             # MODIFIED: Show real code snippets
│       └── deploy-modal.tsx              # MODIFIED: Connect to real useDeploy
└── app/
    └── projects/
        └── [id]/
            └── page.tsx                  # MODIFIED: Use real generation hooks
```

**Structure Decision**: Web application (frontend only). All new code resides in `frontend/lib/` following existing patterns. No backend changes needed - WebSocket server already implemented. Integration points:
- `lib/ws/` - new directory for WebSocket client
- `lib/hooks/` - extend existing hooks directory
- `lib/api/` - extend existing API layer
- `components/generation/` - modify existing UI components

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations. All constitution principles followed.

---

## Phase Completion Summary

### Phase 0: Research ✅ COMPLETE

**Artifacts**:
- ✅ `research.md` - Library evaluation, best practices, integration approach

**Key Decisions**:
- Selected: react-use-websocket v4.8+ (96.5/100 Context7 score, 200k+ weekly downloads)
- Rejected: Native WebSocket API (too low-level), Socket.IO (protocol mismatch)
- Approach: Custom hooks wrapping react-use-websocket, React Query integration

### Phase 1: Design ✅ COMPLETE

**Artifacts**:
- ✅ `data-model.md` - Complete type definitions for all entities (7 message types, 3 state entities)
- ✅ `contracts/rest-api.md` - 5 REST endpoints documented with request/response schemas
- ✅ `contracts/websocket-messages.md` - 7 WebSocket message types with full specifications
- ✅ `quickstart.md` - Developer guide with examples, patterns, troubleshooting

**Agent Context**:
- ✅ `CLAUDE.md` updated with new technologies (react-use-websocket, WebSocket integration)

### Phase 2: Tasks ⏳ PENDING

**Next Action**: Run `/speckit.tasks` to generate atomic implementation tasks from this plan.

**Expected Output**:
- `tasks.md` with ordered, independent tasks
- Task assignments to existing or new agents
- Dependency graph for parallel execution

---

## Implementation Readiness

**Ready for Implementation**: ✅ YES

All prerequisites met:
- ✅ Library research complete with clear decision
- ✅ Data model fully specified with TypeScript types
- ✅ API contracts documented (REST + WebSocket)
- ✅ Developer guide available for quick onboarding
- ✅ Constitution gates passed (no violations)
- ✅ Agent context updated

**Estimated Implementation Time**: 2-3 days (per original spec)

**Next Steps**:
1. Run `/speckit.tasks` to generate implementation tasks
2. Execute tasks in dependency order
3. Validate with type-check + build after each task
4. Commit atomically after validation
