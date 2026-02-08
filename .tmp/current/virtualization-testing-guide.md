# ProjectsList Virtualization - Testing Guide

## Quick Testing Instructions

### 1. Manual Testing with Mock Data

Add mock data temporarily to the projects page for testing:

```tsx
// In /home/alex/PycharmProjects/viably/frontend/app/projects/page.tsx
// Add import at top:
import { generateMockProjects } from "@/lib/utils/mock-projects"

// Replace the filtered projects with mock data:
const filtered = generateMockProjects(500) // Test with 500 projects

// Or mix with real data:
const filtered = [...allProjects, ...generateMockProjects(400)]
  .filter((p) => {
    const matchesFilter = filter === "all" || p.status === filter
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    return matchesFilter && matchesSearch
  })
  .sort((a, b) => {
    // ... existing sort logic
  })
```

### 2. Visual Verification

**Expected Behavior:**
1. **Grid View (viewMode="grid")**
   - Only visible cards are rendered
   - Smooth scrolling with no jank
   - Cards maintain proper spacing (gap-6)
   - 3 columns on desktop (lg breakpoint)
   - 2 columns on tablet (md breakpoint)
   - 1 column on mobile (sm breakpoint)

2. **List View (viewMode="list")**
   - Only visible rows are rendered
   - Compact row layout
   - Smooth scrolling
   - All row information visible (emoji, name, category, status, time, actions)

### 3. Performance Testing

#### Browser DevTools Method

1. **Open DevTools** (F12)
2. **Go to Performance tab**
3. **Click Record** (red circle)
4. **Scroll through the list** (up and down rapidly)
5. **Stop recording** after 5-10 seconds
6. **Analyze results**:
   - **FPS should be 60fps** (green bar should be solid)
   - **Frame time should be <16ms** per frame
   - **No long tasks** (yellow/red bars)

#### Console Performance Method

```tsx
// Add to page component (temporary):
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Projects count:', filtered.length)
    console.log('🎨 View mode:', viewMode)

    // Count DOM nodes
    const projectNodes = document.querySelectorAll('[data-index]').length
    console.log('🔢 Rendered DOM nodes:', projectNodes)

    // Should be ~20-30 nodes regardless of total count
    if (projectNodes > 50 && filtered.length > 100) {
      console.warn('⚠️ Too many DOM nodes! Virtualization may not be working.')
    } else {
      console.log('✅ Virtualization working correctly!')
    }
  }
}, [filtered.length, viewMode])
```

### 4. Functional Testing Checklist

- [ ] **Scrolling**
  - [ ] Smooth scroll in grid view
  - [ ] Smooth scroll in list view
  - [ ] No blank spaces while scrolling
  - [ ] No flickering or jank

- [ ] **View Switching**
  - [ ] Switch from grid to list view
  - [ ] Switch from list to grid view
  - [ ] Maintains scroll position (or resets appropriately)

- [ ] **Filtering**
  - [ ] Search filter works correctly
  - [ ] Status filter works correctly
  - [ ] Empty state shows when no results

- [ ] **Sorting**
  - [ ] Sort by newest works
  - [ ] Sort by oldest works
  - [ ] Sort by name works

- [ ] **Actions**
  - [ ] Click on project opens detail page
  - [ ] Action menu opens correctly
  - [ ] Delete dialog opens correctly
  - [ ] Delete action works

- [ ] **Responsive**
  - [ ] Mobile view (1 column grid)
  - [ ] Tablet view (2 column grid)
  - [ ] Desktop view (3 column grid)
  - [ ] List view responsive layout

- [ ] **Edge Cases**
  - [ ] 0 projects (empty state)
  - [ ] 1-19 projects (non-virtualized)
  - [ ] 20-99 projects (virtualized, threshold)
  - [ ] 100+ projects (virtualized, performance test)
  - [ ] 1000+ projects (stress test)

### 5. Performance Benchmarks

Use this script to measure performance:

```tsx
// Add to page component (temporary):
import { measureRenderPerformance, logPerformanceMetrics } from "@/lib/utils/mock-projects"

useEffect(() => {
  const metrics = measureRenderPerformance(() => {
    // Force a re-render
    setSearchQuery(searchQuery)
  })

  logPerformanceMetrics('Projects List Render', metrics)
}, [searchQuery])
```

**Expected Results:**
- **<20 projects**: <50ms render time
- **20-100 projects**: <50ms render time (virtualized)
- **100+ projects**: <100ms render time (virtualized)
- **1000+ projects**: <200ms render time (virtualized)

### 6. Memory Testing

1. **Open DevTools** → **Memory tab**
2. **Take a heap snapshot** (before rendering)
3. **Render 1000 projects**
4. **Take another heap snapshot** (after rendering)
5. **Compare snapshots**

**Expected Memory Usage:**
- Non-virtualized 1000 projects: ~50-100MB
- Virtualized 1000 projects: ~5-10MB
- **Memory reduction**: 90%+

### 7. Accessibility Testing

- [ ] **Keyboard Navigation**
  - [ ] Tab through list items
  - [ ] Enter/Space opens project
  - [ ] Arrow keys work (if implemented)

- [ ] **Screen Reader**
  - [ ] Project cards are announced correctly
  - [ ] Status badges are readable
  - [ ] Action menu is accessible

### 8. Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 9. Automated Testing (Optional)

Create a Playwright test:

```typescript
// tests/virtualization.spec.ts
import { test, expect } from '@playwright/test'

test('virtualized list renders only visible items', async ({ page }) => {
  await page.goto('/projects')

  // Wait for projects to load
  await page.waitForSelector('[data-index]')

  // Count rendered items
  const renderedItems = await page.$$('[data-index]')

  // Should render ~20-30 items regardless of total count
  expect(renderedItems.length).toBeLessThan(50)

  // Scroll down
  await page.evaluate(() => {
    window.scrollBy(0, 1000)
  })

  // Wait for new items to render
  await page.waitForTimeout(100)

  // Count should still be ~20-30
  const newRenderedItems = await page.$$('[data-index]')
  expect(newRenderedItems.length).toBeLessThan(50)
})

test('virtualization handles scroll performance', async ({ page }) => {
  await page.goto('/projects')

  // Start performance monitoring
  await page.evaluate(() => {
    (window as any).scrollEvents = []
    window.addEventListener('scroll', () => {
      (window as any).scrollEvents.push(Date.now())
    })
  })

  // Rapid scroll
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(50)
  }

  // Check that scroll was smooth (no dropped frames)
  const scrollEvents = await page.evaluate(() => (window as any).scrollEvents.length)
  expect(scrollEvents).toBeGreaterThan(50) // Should have many scroll events
})
```

### 10. Debugging Tips

#### If virtualization is not working:

1. **Check DOM nodes count**
   ```javascript
   document.querySelectorAll('[data-index]').length
   // Should be <50 for 100+ projects
   ```

2. **Check scroll container**
   ```javascript
   const container = document.querySelector('.h-\\[calc\\(100vh-20rem\\)\\]')
   console.log('Container:', container)
   console.log('Scroll height:', container?.scrollHeight)
   ```

3. **Check useVirtualizer**
   - Ensure `getScrollElement` returns valid ref
   - Ensure `count` is correct
   - Check console for errors

4. **Verify threshold**
   - Projects count >= 20 should use virtualization
   - Projects count < 20 should use standard rendering

### 11. Rollback Plan

If virtualization causes issues:

1. **Immediate fix**: Comment out virtualization import
   ```tsx
   // import { ProjectsList } from "@/components/projects/projects-list"
   import { ProjectCard } from "@/components/projects/project-card"
   import { ProjectListRow } from "@/components/projects/project-list-row"
   ```

2. **Restore old rendering**
   ```tsx
   {/* <ProjectsList projects={filtered} viewMode={viewMode} onDelete={handleDeleteRequest} /> */}
   {viewMode === "grid" ? (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {filtered.map((project) => (
         <ProjectCard key={project.id} project={project} onDelete={handleDeleteRequest} />
       ))}
     </div>
   ) : (
     <div className="space-y-1">
       {filtered.map((project) => (
         <ProjectListRow key={project.id} project={project} onDelete={handleDeleteRequest} />
       ))}
     </div>
   )}
   ```

### 12. Success Criteria

✅ **Pass Criteria:**
- Smooth 60fps scrolling with 100+ projects
- <50 DOM nodes rendered regardless of total count
- No visual glitches or blank spaces
- All existing functionality works (filter, sort, delete)
- Memory usage <10MB for 1000 projects
- No console errors or warnings

❌ **Fail Criteria:**
- FPS drops below 30fps
- >100 DOM nodes for 100+ projects
- Visual glitches during scroll
- Broken functionality
- Console errors

---

## Quick Start Command

```bash
# 1. Start development server
cd frontend && npm run dev

# 2. Open browser to http://localhost:3000/projects

# 3. Open DevTools Console (F12)

# 4. Paste this to test with mock data:
localStorage.setItem('test_virtualization', 'true')
window.location.reload()
```

Then add this to your page component:

```tsx
useEffect(() => {
  if (localStorage.getItem('test_virtualization') === 'true') {
    console.log('🧪 Test mode: Loading 500 mock projects')
    // Use generateMockProjects(500) instead of real data
  }
}, [])
```

---

**Happy Testing!** 🚀
