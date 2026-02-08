# Library Profiling: Top 10 Memory Consumers

**Date**: 2026-02-08
**Project**: Viably Frontend
**Analysis**: Memory and Bundle Size Impact

---

## Executive Summary

This document profiles the top 10 libraries by memory usage in the Viably frontend application. Total `node_modules` size is **1.1GB**, with the top 10 libraries accounting for **~650MB (59%)** of disk usage.

### Key Findings

- **monaco-editor**: Single largest optimization opportunity (76MB)
- **Next.js framework**: Essential but optimizable in dev mode (384MB)
- **Monitoring tools**: Sentry + PostHog can be conditionally loaded (84MB)
- **Icon library**: lucide-react has tree-shaking issues (45MB)
- **OpenTelemetry**: Large telemetry stack, mostly dev-only (56MB)

---

## Top 10 Libraries by Memory Usage

### 1. Next.js Framework (384MB)

**Package**: `@next` + `next`
**Disk Usage**: 226MB (@next) + 158MB (next) = 384MB
**Bundle Impact**: Framework overhead (runtime ~150KB gzipped)
**Version**: 16.1.6

#### Analysis
- **Necessity**: CRITICAL - Core framework for the application
- **Memory Breakdown**:
  - Build tools and compilers (SWC, webpack)
  - Server-side rendering infrastructure
  - Development mode hot-reload system
  - Route handlers and middleware
- **Production Impact**: Only runtime code shipped (~150KB)

#### Alternatives Considered
- None - Next.js is the chosen framework

#### Optimization Recommendations
1. **Dev Mode Optimization** (DONE in T057):
   - Disabled experimental `isrFlushToDisk`
   - Optimized build cache settings
2. **Production Build**:
   - Enable `swcMinify: true` (already set)
   - Remove console logs in production
   - Disable source maps for production

**Status**: NECESSARY - No changes recommended

---

### 2. Monaco Editor (76MB)

**Package**: `monaco-editor` + `@monaco-editor/react`
**Disk Usage**: 76MB (monaco-editor) + 500KB (wrapper) = 76.5MB
**Bundle Impact**: ~3.8MB uncompressed, ~1.2MB gzipped
**Version**: 4.7.0 (monaco-editor), 4.7.0 (wrapper)

#### Analysis
- **Necessity**: LOW - Used only for code display in project pages
- **Memory Breakdown**:
  - Full VS Code editor engine
  - 50+ language syntax highlighters
  - Language server protocol support
  - Diff editor, minimap, IntelliSense
- **Actual Usage**: Read-only code display (no editing required)

#### Alternatives

**Option A: react-syntax-highlighter** (RECOMMENDED)
- **Bundle Size**: ~100KB (vs 3.8MB)
- **Savings**: 75.5MB disk, ~3.7MB bundle
- **Capabilities**: Syntax highlighting, theming
- **Already Available**: `prism-react-renderer` is installed

**Option B: @uiw/react-codemirror**
- **Bundle Size**: ~500KB (if editing needed)
- **Savings**: 74MB disk, ~3.3MB bundle
- **Capabilities**: Lightweight editor with plugins

#### Optimization Recommendations
1. **Replace with prism-react-renderer** (CRITICAL):
   ```bash
   npm remove @monaco-editor/react monaco-editor
   npm install react-syntax-highlighter @types/react-syntax-highlighter
   ```
2. **Update Components**:
   - Migrate `CodeViewer` component
   - Replace all Monaco usage in project pages
3. **Expected Savings**: 75.5MB disk, ~1.2MB gzipped bundle

**Priority**: HIGH - Largest single optimization opportunity
**Impact**: -75.5MB (-6.8% of node_modules)
**Effort**: 2-3 hours

---

### 3. OpenTelemetry (56MB)

**Package**: `@opentelemetry/*` (dependency of @sentry/nextjs)
**Disk Usage**: 56MB (multiple sub-packages)
**Bundle Impact**: ~200KB (minimal, conditionally loaded)
**Version**: Various (pulled by Sentry)

#### Analysis
- **Necessity**: MEDIUM - Telemetry framework for Sentry
- **Memory Breakdown**:
  - Core instrumentation libraries
  - Protocol buffers for traces
  - SDK for various platforms
  - Exporters and processors
- **Usage**: Automatic instrumentation via Sentry

#### Alternatives
- Use Sentry's minimal client without OpenTelemetry
- Conditionally load only in production

#### Optimization Recommendations
1. **Conditional Loading** (RECOMMENDED):
   ```typescript
   // next.config.ts - wrap Sentry only for production
   const isDev = process.env.NODE_ENV === 'development'
   export default isDev
     ? config
     : withSentryConfig(config, {...})
   ```
2. **Production-Only Bundle**:
   - OpenTelemetry loaded only when needed
   - Dev mode skips entire Sentry wrapper

**Priority**: MEDIUM
**Impact**: -56MB dev mode, 0 production (already tree-shaken)
**Effort**: 30 minutes

---

### 4. Sentry (52MB)

**Package**: `@sentry/nextjs` + dependencies
**Disk Usage**: 52MB
**Bundle Impact**: ~80KB gzipped (production only)
**Version**: 10.38.0

#### Analysis
- **Necessity**: HIGH - Error monitoring and performance tracking
- **Memory Breakdown**:
  - Next.js integration layer
  - Browser SDK
  - Node.js SDK
  - Source map uploader
  - Webpack plugin
- **Production Impact**: 80KB (acceptable for monitoring)

#### Alternatives
- LogRocket (similar size)
- Bugsnag (slightly smaller)
- Native error boundaries (no monitoring)

#### Optimization Recommendations
1. **Conditional Loading** (RECOMMENDED):
   - Load only in production builds
   - Skip in development mode
   - Combine with OpenTelemetry optimization
2. **Lazy Initialization**:
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     Sentry.init({...})
   }
   ```

**Priority**: MEDIUM
**Impact**: -52MB dev mode, 0 production
**Effort**: 30 minutes (combined with #3)

---

### 5. Lucide React (45MB)

**Package**: `lucide-react`
**Disk Usage**: 45MB
**Bundle Impact**: ~5KB per icon (if tree-shaken), up to 1MB (if not)
**Version**: 0.563.0

#### Analysis
- **Necessity**: HIGH - Icon library used throughout the app
- **Memory Breakdown**:
  - 1,400+ individual icon components
  - SVG data for each icon
  - TypeScript definitions
  - React wrappers
- **Potential Issue**: Tree-shaking may not be optimal

#### Alternatives
- `@lucide/react` (alternative package name, same library)
- `react-icons` (similar size, more icons)
- Custom SVG sprite sheet (best for production)

#### Optimization Recommendations
1. **Verify Tree-Shaking** (CRITICAL):
   ```bash
   grep -r "import.*from.*lucide-react" src/
   ```
   Check for:
   - ❌ `import * as Icons from 'lucide-react'`
   - ✅ `import { Settings, User } from 'lucide-react'`

2. **Named Imports Only**:
   - Ensure all imports are named
   - Bundle analyzer will show actual impact
   - Likely only 20-30 icons used (~100-150KB)

3. **Alternative: Icon Sprite**:
   - For production: custom SVG sprite
   - Include only used icons
   - Size: ~10-20KB total

**Priority**: MEDIUM
**Impact**: -30-40MB disk (tree-shaking), minimal bundle impact
**Effort**: 1 hour (audit imports)

---

### 6. PostHog (32MB)

**Package**: `posthog-js`
**Disk Usage**: 32MB
**Bundle Impact**: ~60KB gzipped
**Version**: 1.342.1

#### Analysis
- **Necessity**: HIGH - Product analytics and feature flags
- **Memory Breakdown**:
  - Analytics SDK
  - Session recording library
  - Feature flags client
  - TypeScript definitions
- **Production Impact**: 60KB (acceptable for analytics)

#### Alternatives
- Google Analytics (lighter but less features)
- Mixpanel (similar size)
- Plausible (much lighter, less features)

#### Optimization Recommendations
1. **Lazy Loading** (RECOMMENDED):
   ```typescript
   // Load only in production
   export const initPostHog = () => {
     if (process.env.NODE_ENV === 'production') {
       return import('posthog-js').then(({ default: posthog }) => {
         posthog.init(...)
       })
     }
   }
   ```

2. **Feature-Specific Imports**:
   - PostHog supports tree-shaking
   - Import only needed features
   - Skip session recording if not needed

**Priority**: MEDIUM
**Impact**: -32MB dev mode, 0 production
**Effort**: 30 minutes

---

### 7. TypeScript (23MB)

**Package**: `typescript`
**Disk Usage**: 23MB
**Bundle Impact**: 0 (dev-only)
**Version**: 5.x

#### Analysis
- **Necessity**: CRITICAL - Type checking and compilation
- **Memory Breakdown**:
  - TypeScript compiler
  - Language service
  - Type definitions
  - Standard library types
- **Production Impact**: None (dev dependency)

#### Alternatives
- None - TypeScript is essential

#### Optimization Recommendations
- **No changes recommended** - already in devDependencies
- TypeScript is not bundled in production
- Size is acceptable for development

**Status**: NECESSARY - Keep as-is

---

### 8. LightningCSS (18MB)

**Package**: `lightningcss-*` (platform binaries)
**Disk Usage**: 18MB (9.1MB GNU + 9.1MB MUSL + stubs)
**Bundle Impact**: 0 (build-time only)
**Version**: Various (via Tailwind CSS v4)

#### Analysis
- **Necessity**: HIGH - CSS processing for Tailwind v4
- **Memory Breakdown**:
  - Native binaries for multiple platforms
  - linux-x64-gnu (9.1MB)
  - linux-x64-musl (9.1MB)
  - Platform stubs (minimal)
- **Issue**: Duplicate Linux binaries installed

#### Alternatives
- PostCSS (heavier, slower)
- Stick with LightningCSS (best performance)

#### Optimization Recommendations
1. **Remove Duplicate Binaries** (EASY):
   ```bash
   npm dedupe
   npm prune
   ```
2. **Platform-Specific Install**:
   - Configure npm to install only current platform binary
   - Saves ~9MB per duplicate platform

**Priority**: LOW (easy win)
**Impact**: -9MB disk
**Effort**: 5 minutes

---

### 9. Playwright (14MB)

**Package**: `playwright-core` + `@playwright/test`
**Disk Usage**: 9.8MB (playwright-core) + 4MB (playwright) = 13.8MB
**Bundle Impact**: 0 (dev-only, but in dependencies)
**Version**: 1.58.2

#### Analysis
- **Necessity**: HIGH - E2E testing framework
- **Memory Breakdown**:
  - Browser automation core
  - Test runner
  - TypeScript definitions
- **Issue**: Listed in `dependencies` instead of `devDependencies`

#### Alternatives
- Cypress (similar size)
- Puppeteer (slightly lighter)

#### Optimization Recommendations
1. **Move to devDependencies** (CRITICAL):
   ```bash
   npm install -D @playwright/test
   ```
   This is already done in package.json (line 57)

**Priority**: LOW (already fixed)
**Impact**: 0 (already in devDependencies)
**Effort**: Already done

---

### 10. React Email (8MB)

**Package**: `react-email` + `@react-email/components`
**Disk Usage**: 8MB (combined)
**Bundle Impact**: ~50KB (if bundled)
**Version**: 5.2.8 + 1.0.7

#### Analysis
- **Necessity**: MEDIUM - Email template preview/development
- **Memory Breakdown**:
  - Email component library
  - Preview server
  - Template renderer
- **Issue**: Listed in `dependencies` (should be devDependencies)

#### Alternatives
- MJML (similar approach)
- Manual HTML emails (more work)

#### Optimization Recommendations
1. **Move to devDependencies** (EASY):
   ```bash
   npm uninstall react-email @react-email/components
   npm install -D react-email @react-email/components
   ```

2. **Rationale**:
   - Email templates only needed for development preview
   - Production uses rendered HTML, not components
   - Should not ship to production bundle

**Priority**: LOW (nice to have)
**Impact**: -8MB (prevents accidental bundling)
**Effort**: 5 minutes

---

## Summary Table

| Rank | Library | Disk Size | Bundle Impact | Priority | Savings | Status |
|------|---------|-----------|---------------|----------|---------|--------|
| 1 | Next.js | 384MB | ~150KB | N/A | 0 | KEEP |
| 2 | Monaco Editor | 76MB | ~1.2MB | HIGH | -76MB | REPLACE |
| 3 | OpenTelemetry | 56MB | ~200KB | MEDIUM | -56MB (dev) | OPTIMIZE |
| 4 | Sentry | 52MB | ~80KB | MEDIUM | -52MB (dev) | OPTIMIZE |
| 5 | Lucide React | 45MB | ~5KB/icon | MEDIUM | -30-40MB | AUDIT |
| 6 | PostHog | 32MB | ~60KB | MEDIUM | -32MB (dev) | OPTIMIZE |
| 7 | TypeScript | 23MB | 0 | N/A | 0 | KEEP |
| 8 | LightningCSS | 18MB | 0 | LOW | -9MB | DEDUPE |
| 9 | Playwright | 14MB | 0 | N/A | 0 | FIXED |
| 10 | React Email | 8MB | ~50KB | LOW | -8MB | MOVE TO DEV |

**Total Potential Savings**: ~214MB (-19% of node_modules)
**Bundle Size Savings**: ~1.2MB gzipped (Monaco replacement)
**Development Mode Savings**: ~172MB (conditional loading)

---

## Profiling Methodology

### 1. Disk Usage Analysis

**Tool**: `du -sh node_modules/[package]`

```bash
cd /home/alex/PycharmProjects/viably/frontend
du -sh node_modules/@next node_modules/next node_modules/monaco-editor \
       node_modules/@sentry node_modules/posthog-js node_modules/lucide-react \
       node_modules/@opentelemetry node_modules/typescript \
       node_modules/lightningcss* node_modules/playwright* \
       node_modules/react-email 2>/dev/null | sort -rh
```

**Output**: Sorted list of packages by disk size

### 2. Bundle Impact Analysis

**Tool**: `@next/bundle-analyzer`

```bash
ANALYZE=true npm run build
```

**Configuration** (`next.config.ts`):
```typescript
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
```

**Output**:
- Client bundle analysis (HTML report)
- Server bundle analysis
- Shared chunks visualization

### 3. Memory Heap Snapshot

**Tool**: Chrome DevTools Memory Profiler

**Process**:
1. Open application in Chrome
2. DevTools → Memory → Heap Snapshot
3. Take snapshot after full page load
4. Analyze "Allocated Size" by constructor
5. Group by package origin

**Captured**: Task T060

### 4. Package Metadata

**Tool**: `npm list` and `package.json` inspection

```bash
npm list --depth=0 --production
npm list --depth=0 --dev
```

**Analysis**:
- Dependency vs devDependency classification
- Direct dependencies vs sub-dependencies
- Version information

### 5. Tree-Shaking Verification

**Tool**: Bundle analyzer + manual code inspection

```bash
grep -r "import.*from.*'[package]'" src/
```

**Checks**:
- Named imports vs namespace imports
- Dynamic imports vs static imports
- Conditional loading patterns

### 6. Production Bundle Size

**Tool**: `bundle-phobia` (when available) or build analysis

**Command**:
```bash
npx bundle-phobia-cli [package-name]
```

**Fallback**: Manual inspection of `.next/static/` after production build

---

## Optimization Decision Framework

### Priority Matrix

| Impact | Effort | Priority |
|--------|--------|----------|
| High Impact / Low Effort | HIGH |
| High Impact / High Effort | MEDIUM |
| Low Impact / Low Effort | LOW |
| Low Impact / High Effort | SKIP |

### Criteria for "Necessity"

**CRITICAL**: Required for core functionality
- Framework (Next.js, React)
- Type system (TypeScript)
- Core UI components

**HIGH**: Used throughout the application
- Icon library (lucide-react)
- State management (zustand)
- Data fetching (@tanstack/react-query)

**MEDIUM**: Used in specific features
- Analytics (PostHog)
- Monitoring (Sentry)
- Email templates (react-email)

**LOW**: Can be replaced or removed
- Code editor (Monaco) - only for display
- Heavy dependencies with lighter alternatives

### Replacement Criteria

Replace a library when:
1. **Size > 50MB** AND **Usage < 30% of features**
2. **Bundle impact > 500KB** AND **Alternative < 100KB exists**
3. **Dev-only usage** AND **Listed in dependencies**

### Conditional Loading Criteria

Use conditional loading when:
1. **Monitoring/analytics** - not needed in development
2. **Feature flags** - can be mocked in development
3. **Platform-specific** - load only for current platform

---

## Next Steps

### Immediate (High Priority)
1. **T058**: Replace Monaco Editor with prism-react-renderer
   - Savings: 76MB disk, 1.2MB bundle
   - Effort: 2-3 hours
   - Files: CodeViewer component, project pages

2. **T059**: Conditional loading for Sentry/PostHog
   - Savings: 88MB dev mode
   - Effort: 30 minutes
   - Files: next.config.ts, lib/posthog.ts

### Short-term (Medium Priority)
3. **Audit lucide-react imports**
   - Verify tree-shaking effectiveness
   - Ensure named imports only
   - Effort: 1 hour

4. **Bundle analysis review**
   - Run production build analysis
   - Verify actual bundle sizes
   - Compare before/after optimizations

### Long-term (Low Priority)
5. **npm dedupe and cleanup**
   - Remove duplicate dependencies
   - Clean up unused packages
   - Savings: ~10MB

6. **Documentation update**
   - Document optimization results
   - Update architecture decisions
   - Create dependency guidelines

---

## References

- **Heap Snapshot**: Task T060
- **Bundle Analysis**: Task T061
- **Memory Report**: `.tmp/current/memory-optimization-report.md`
- **Package.json**: `frontend/package.json`
- **Next.js Config**: `frontend/next.config.ts`

---

**Document Version**: 1.0
**Last Updated**: 2026-02-08
**Next Review**: After optimization implementation
