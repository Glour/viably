# Quickstart: Generation Flow

**Feature**: 013-generation-flow
**Date**: 2026-02-06

---

## Prerequisites

- Node.js 18+
- Frontend dev server running (`npm run dev` in `/frontend`)
- Existing modules working: design system, templates gallery, projects pages

## Setup

```bash
cd frontend

# Install new dependencies
npm install react-resizable-panels client-zip canvas-confetti prism-react-renderer

# Install type definitions
npm install -D @types/canvas-confetti
```

## File Structure (new files)

```
frontend/
├── app/projects/[id]/generate/
│   └── page.tsx                          # Generation page (split view)
├── components/generation/
│   ├── compact-navbar.tsx                # Slim navbar for generation page
│   ├── chat-panel.tsx                    # Left panel: chat + config
│   ├── config-form.tsx                   # Dynamic form from template fields
│   ├── free-text-input.tsx               # Alternative free text input
│   ├── preview-panel.tsx                 # Right panel: tabs + states
│   ├── generation-progress.tsx           # Step-by-step progress view
│   ├── code-snippet-animation.tsx        # Animated code blocks (typewriter)
│   ├── idle-state.tsx                    # Pre-generation placeholder
│   ├── error-state.tsx                   # Generation error view
│   ├── complete-state.tsx                # Post-generation code view + actions
│   ├── deploy-modal.tsx                  # Multi-phase deploy modal
│   ├── deploy-progress.tsx               # Deploy steps progress
│   ├── deploy-success.tsx                # Success state with confetti
│   └── mobile-tabs.tsx                   # Mobile tab navigation
├── lib/
│   ├── api/generation.ts                 # Mock API functions
│   ├── data/generation.ts                # Mock generated code data
│   └── generation/
│       └── use-generation.ts             # Generation hook with simulation
├── stores/
│   └── generation.ts                     # Zustand generation store
└── types/
    └── index.ts                          # New types added (append)
```

## Dev Workflow

1. Navigate to any template detail page (e.g., `/templates/shop-bot`)
2. Click "Create Project" — redirects to `/projects/{id}/generate`
3. Generation page loads with template info and config form
4. Fill form fields or enter free text
5. Click "Generate" — progress simulation starts
6. After ~15-25s — code viewer appears
7. Click "Deploy" — deploy modal with 3 phases
8. Or click "Download ZIP" — downloads archive

## Routing

The generation page URL: `/projects/[id]/generate`

This route is already referenced by `createProjectFromTemplate()` in `lib/api/templates.ts` which returns `redirectUrl: /projects/${projectId}/generate`.

## Key Integration Points

| Integration | Source | Usage |
|-------------|--------|-------|
| Template data | `useTemplatesStore` / `lib/api/templates.ts` | Config fields, credit cost |
| Project data | `useProjectsStore` / `lib/api/projects.ts` | Project ID, status |
| User credits | `useDashboardStore` | Credit balance check |
| Code viewer | `components/projects/code-viewer.tsx` | Reused in complete state |
| UI components | `components/ui/*` | Form, Dialog, Tabs, Button, etc. |
| Animations | `lib/animations.ts` + `motion` | All transitions and effects |

## Testing

```bash
# Type check
npm run type-check

# Build
npm run build

# Dev server
npm run dev
```

Verify:
- [ ] `/projects/[id]/generate` renders split view
- [ ] Config form populates from template
- [ ] Generate button starts simulation
- [ ] Progress steps animate sequentially
- [ ] Code viewer loads on completion
- [ ] Deploy modal flows through 3 phases
- [ ] Download ZIP creates file
- [ ] Mobile tabs work at <768px viewport
