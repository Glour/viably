# Memory Baseline Profiling - 2026-02-08

**Feature**: 020-memory-optimization
**Purpose**: Baseline metrics before optimization to measure improvement

## Test Environment

- Browser: [Chrome 120+ / Firefox 120+ / Safari 17+]
- Device: [CPU, RAM specs]
- Date: 2026-02-08
- Application Version: [commit hash]

## Baseline Measurements

### Initial Load (Fresh Start)

**Test**: Open application homepage
- Heap Size Used: ___ MB
- Total JS Heap: ___ MB
- Component Count: ___
- Event Listeners: ___

### After 30 Minutes (Typical Usage)

**Test**: Navigate between pages, open modals, use features
- Heap Size Used: ___ MB
- Total JS Heap: ___ MB
- Growth from Initial: ___ MB (___ %)

### After 4 Hours (Long Session)

**Test**: Extended usage with navigation cycles
- Heap Size Used: ___ MB
- Total JS Heap: ___ MB
- Growth from Initial: ___ MB (___ %)
- **Target**: <20% growth

## Memory Leak Tests

### Modal Open/Close (50 cycles)

**Test**: Open and close modal 50 times
- Before: ___ MB
- After: ___ MB
- Memory Released: ___ %
- **Target**: ±5% of initial

### Page Navigation (100 cycles)

**Test**: Navigate between pages 100 times
- Before: ___ MB
- After: ___ MB
- Growth: ___ %
- **Target**: <10% growth

## Component-Specific Tests

### Templates Gallery (500 items)

**Test**: Load gallery with 500 templates, scroll
- Memory Used: ___ MB
- Frame Rate: ___ FPS
- **Target**: >30 FPS, <200MB

### Monaco Editor - Heap Snapshot Verification

**Implementation**: `frontend/hooks/useMonacoEditor.ts` with auto-disposal

**Disposal Mechanism**:
- Editor instances: `editor.dispose()` on unmount
- Text models: `model.dispose()` on unmount
- Resource tracking: Integrated with `useComponentCleanup`
- Cleanup timing: Automatic via React useEffect cleanup

**Test Methodology**: Heap snapshot comparison

1. **Prerequisites**:
   - Chrome browser with flags: `--enable-precise-memory-info --js-flags="--expose-gc"`
   - DevTools Memory tab open
   - Test file: `frontend/scripts/test-monaco-memory.html`

2. **Test Procedure**:
   ```bash
   # Open test file in Chrome with flags
   google-chrome --enable-precise-memory-info --js-flags="--expose-gc" \
     file:///path/to/viably/frontend/scripts/test-monaco-memory.html
   ```

   a. **Capture Baseline** (Snapshot 1):
      - Fresh page load, no editor
      - Take heap snapshot
      - Record: Heap size used, total JS heap

   b. **Open Monaco Editor** (Snapshot 2):
      - Click "Open Editor" button
      - Wait for Monaco to fully load
      - Take heap snapshot
      - Record: Heap growth from baseline

   c. **Close Editor + Force GC** (Snapshot 3):
      - Click "Close Editor" (triggers dispose)
      - Click "Force GC" 3-5 times
      - Wait 2-3 seconds between GCs
      - Take heap snapshot

   d. **Compare Snapshots**:
      - In DevTools: Select Snapshot 3, compare with Snapshot 1
      - Search for "monaco", "editor", "model" objects
      - Calculate: `(Snapshot3 - Snapshot1) / (Snapshot2 - Snapshot1)`

3. **Expected Results**:

   | Metric | Target | Acceptable | Fail |
   |--------|--------|------------|------|
   | Memory Released | >90% | 70-90% | <70% |
   | Monaco Objects Retained | 0-5 | 5-20 | >20 |
   | Heap Growth from Baseline | <5% | 5-10% | >10% |

4. **Test Results**: *(To be filled after running test)*

   **Snapshot 1 (Baseline)**:
   - Heap Used: ___ MB
   - Total JS Heap: ___ MB
   - Monaco Objects: 0

   **Snapshot 2 (With Editor)**:
   - Heap Used: ___ MB (+___ MB)
   - Total JS Heap: ___ MB
   - Monaco Objects: ~___
   - Growth: ___% from baseline

   **Snapshot 3 (After Close + GC)**:
   - Heap Used: ___ MB
   - Total JS Heap: ___ MB
   - Monaco Objects: ___ (should be 0-5)
   - Memory Released: ___% (target: >90%)
   - Remaining Growth: ___% (target: <5%)

5. **Verification Steps**:

   In DevTools Memory tab, comparing Snapshot 3 to Snapshot 1:

   - [ ] Filter by "monaco" → Should show 0 or minimal objects
   - [ ] Filter by "editor" → Should show 0 IStandaloneCodeEditor instances
   - [ ] Filter by "model" → Should show 0 ITextModel instances
   - [ ] Check "Detached DOM tree" → Should not contain editor container
   - [ ] Review "Summary" view → "Code" category should return to near-baseline

6. **Automated Test** (10 cycles):
   ```
   Click "Run Auto Test" in test-monaco-memory.html
   - Opens/closes editor 10 times
   - Measures final heap vs baseline
   - Editor/model counts should return to 0
   ```

7. **Real-World Integration Test**:

   Test in actual application (Generation Flow):

   ```bash
   cd frontend
   npm run dev
   ```

   Steps:
   - Navigate to `/generation`
   - Open Monaco editor (triggers useMonacoEditor mount)
   - Take heap snapshot (Snapshot A)
   - Navigate away (triggers useMonacoEditor unmount)
   - Force GC via DevTools
   - Take heap snapshot (Snapshot B)
   - Compare: Snapshot B should show disposed editor/model

**Known Limitations**:

- Small objects (<1KB) may persist temporarily in V8's young generation
- Compiled worker scripts cache in Monaco (expected, not a leak)
- First editor instance loads Monaco library (~5MB, persistent, expected)

**Success Criteria**:

✅ Memory Released: >90%
✅ Monaco Objects Retained: <5
✅ No Detached DOM nodes with editor reference
✅ Heap growth after GC: <5% from baseline

## Identified Issues

### Potential Memory Leaks

1. [Component/Feature]: [Description]
   - Impact: [High/Medium/Low]
   - Reproduction: [Steps]

### Heavy Components

1. [Component]: ___ MB
   - Reason: [Analysis]
   - Optimization Target: [Goal]

## Next Steps

- [ ] Complete all baseline measurements
- [ ] Identify top 5 memory consumers
- [ ] Document leak reproduction steps
- [ ] Set optimization targets per component
