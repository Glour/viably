# Chrome DevTools Heap Snapshot Analysis Guide

**Purpose**: Identify runtime memory usage of JavaScript libraries in the browser  
**Date**: 2026-02-08  
**Project**: Viably Frontend

---

## 🎯 Overview

This guide explains how to capture and analyze heap snapshots to identify which JavaScript libraries consume the most memory at runtime. This complements static bundle analysis by showing actual memory footprint.

---

## 📋 Prerequisites

1. **Chrome/Chromium browser** (recommended: latest stable)
2. **Development server running**: `npm run dev` (Next.js dev server on http://localhost:3000)
3. **Enable precise memory info**: Launch Chrome with flag:
   ```bash
   google-chrome --enable-precise-memory-info
   ```

---

## 🔍 Step-by-Step: Capturing Heap Snapshot

### 1. Launch Chrome with Memory Info Enabled

```bash
# Linux
google-chrome --enable-precise-memory-info http://localhost:3000

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --enable-precise-memory-info http://localhost:3000

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --enable-precise-memory-info http://localhost:3000
```

**Why this flag?**: Enables `performance.memory` API for precise heap size measurements.

### 2. Open Chrome DevTools

- Press **F12** or **Ctrl+Shift+I** (Windows/Linux) or **Cmd+Option+I** (macOS)
- Navigate to **Memory** tab

### 3. Navigate to Target Page

For comprehensive analysis, capture snapshots on key pages:
- ✅ **Dashboard** (`/dashboard`) - most libraries loaded
- ✅ **Project Editor** (`/projects/[id]`) - if using Monaco or heavy editor
- ✅ **Templates Gallery** (`/templates`) - template rendering
- ⚠️ **Auth pages** (`/login`) - minimal, for baseline

### 4. Capture Heap Snapshot

1. In **Memory** tab, select **Heap snapshot**
2. Click **Take snapshot** button (camera icon)
3. Wait 5-10 seconds for snapshot to complete
4. Snapshot appears in left sidebar (e.g., "Snapshot 1")

### 5. Save Snapshot File

1. Right-click on snapshot in sidebar
2. Select **Save...** or **Export...**
3. Save as: `heap-snapshot-[page]-[timestamp].heapsnapshot`
   - Example: `heap-snapshot-dashboard-2026-02-08.heapsnapshot`

---

## 🔬 Manual Analysis in Chrome DevTools

### View 1: Summary (Default)

**Purpose**: Shows memory grouped by constructor/class

**Key columns**:
- **Constructor**: JavaScript class/object type
- **Distance**: Steps from GC root (lower = more persistent)
- **Objects Count**: Number of instances
- **Shallow Size**: Memory used by object itself
- **Retained Size**: Total memory kept alive by object (including references)

**What to look for**:
- Large **Retained Size** values (>10MB)
- High **Objects Count** for library classes
- Constructor names matching library names (e.g., `Monaco`, `Sentry`, `PostHog`)

### View 2: Containment

**Purpose**: Shows object hierarchy from GC roots

**Navigation**:
1. Expand **(GC roots)** → **Window / global**
2. Look for library namespaces:
   - `monaco` → Monaco Editor
   - `__SENTRY__` → Sentry SDK
   - `posthog` → PostHog SDK
   - `lucide` → Lucide Icons (if globally exposed)

**What to look for**:
- Large objects under library namespaces
- Unexpected global variables

### View 3: Comparison (Advanced)

**Purpose**: Compare two snapshots to find memory leaks

**Steps**:
1. Take snapshot 1 (baseline)
2. Interact with app (navigate, open modals, etc.)
3. Take snapshot 2
4. Select snapshot 2 → Change view to **Comparison**
5. Select snapshot 1 as baseline

**What to look for**:
- Objects with **# New** > 0 and **# Deleted** = 0 (potential leak)
- Growing object counts after repeated actions

### View 4: Statistics

**Purpose**: Pie chart showing memory by category

**Categories**:
- **Code**: JavaScript source code (libraries!)
- **Strings**: String allocations
- **JS Arrays**: Array objects
- **Typed Arrays**: Buffers (e.g., images, binary data)
- **System Objects**: Browser internals

**What to look for**:
- **Code** category should be largest after page load
- Unusually large **Strings** or **Typed Arrays** (may indicate data bloat)

---

## 📊 Identifying Library Memory Usage

### Method 1: Search for Library Names

1. In **Summary** view, use search box (Ctrl+F)
2. Search for library names:
   - `monaco` → Monaco Editor
   - `Sentry` → Sentry SDK
   - `posthog` → PostHog
   - `react-query` or `QueryClient` → React Query
   - `zustand` → Zustand stores

3. Check **Retained Size** column for each result

### Method 2: Filter by Code Source

1. In **Summary** view, expand **(compiled code)**
2. Look for large entries with library names in path:
   - `node_modules/monaco-editor/...`
   - `node_modules/@sentry/...`
   - `node_modules/posthog-js/...`

### Method 3: Use Console API

Before taking snapshot, run in Console:
```javascript
// Show current heap size
console.log('Heap Size:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');
console.log('Heap Limit:', (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2), 'MB');

// List all loaded modules (if using Webpack)
if (window.webpackChunk) {
  console.table(
    Object.keys(window.webpackChunk)
      .filter(k => k.includes('node_modules'))
      .map(k => ({ module: k.split('node_modules/')[1] }))
  );
}
```

---

## 🛠️ Automated Analysis Script

See `analyze-heap-snapshot.js` for automated library size extraction.

**Usage**:
```bash
node frontend/scripts/analyze-heap-snapshot.js heap-snapshot-dashboard-2026-02-08.heapsnapshot
```

**Output**:
- Top 10 libraries by retained memory
- JSON report for further analysis
- Summary statistics

---

## 📝 Documenting Results

### Template for Results

Create or update: `.tmp/current/heap-snapshot-analysis.md`

```markdown
# Heap Snapshot Analysis Results

**Date**: 2026-02-08
**Page Analyzed**: Dashboard (/dashboard)
**Browser**: Chrome 131.0.6778.204
**Heap Size**: 145.2 MB

## Top 10 Libraries by Memory Usage

| Library | Retained Size | Objects | Notes |
|---------|---------------|---------|-------|
| monaco-editor | 42.3 MB | 1,245 | Code editor |
| @sentry/browser | 18.7 MB | 892 | Error tracking |
| posthog-js | 12.4 MB | 456 | Analytics |
| ... | ... | ... | ... |

## Key Findings

1. **Monaco Editor dominates**: 42MB runtime (matches 76MB static size)
2. **Sentry initialized in dev**: Should be conditional
3. **Lucide icons**: Only 3.2MB runtime (tree-shaking works!)

## Recommendations

1. Replace Monaco → Prism (priority: HIGH)
2. Disable Sentry in dev mode
3. Keep Lucide (tree-shaking effective)
```

---

## 🎯 Quick Analysis Checklist

For each snapshot:

- [ ] Captured on key page (Dashboard recommended)
- [ ] Chrome launched with `--enable-precise-memory-info`
- [ ] Snapshot saved with descriptive filename
- [ ] Checked **Summary** view for large Retained Sizes
- [ ] Searched for known library names (monaco, sentry, posthog)
- [ ] Documented top 10 libraries
- [ ] Compared with static bundle analysis
- [ ] Identified optimization opportunities

---

## ⚠️ Important Notes

1. **Heap snapshot ≠ Bundle size**:
   - Bundle: Compressed JS file size (network transfer)
   - Heap: Decompressed runtime memory (RAM usage)
   - Heap is typically 2-3x larger than bundle size

2. **Snapshot timing matters**:
   - Take snapshot AFTER page fully loaded
   - Wait for async operations (API calls, lazy imports)
   - Interact with page first (open modals, etc.) for full picture

3. **Dev vs Production**:
   - Dev mode includes sourcemaps, HMR, extra debugging code
   - Production build will show different numbers
   - Always compare apples-to-apples (both dev or both prod)

4. **Browser differences**:
   - Chrome DevTools format is Chrome-specific
   - Firefox has similar tools (Performance → Memory)
   - Results may vary between browsers

---

## 🔗 Additional Resources

- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Heap Snapshot Analysis Guide](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots/)
- [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)
- [Bundle Phobia](https://bundlephobia.com/) - Compare with static sizes

---

## 📞 Support

If you encounter issues:
1. Check Chrome version (update to latest)
2. Verify dev server is running (`npm run dev`)
3. Try incognito mode (disable extensions)
4. Close other tabs to reduce background noise

For automated analysis, see: `frontend/scripts/analyze-heap-snapshot.js`
