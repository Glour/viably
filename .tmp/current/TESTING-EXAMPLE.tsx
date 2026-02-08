/**
 * Testing Example for ProjectsList Virtualization
 *
 * INSTRUCTIONS:
 * 1. Temporarily add this code to /frontend/app/projects/page.tsx
 * 2. Run: npm run dev
 * 3. Open: http://localhost:3000/projects
 * 4. Open DevTools Console (F12)
 * 5. Observe performance metrics and DOM node counts
 * 6. Test scrolling performance
 *
 * REMOVE THIS CODE AFTER TESTING
 */

// ============================================================================
// ADD TO TOP OF /frontend/app/projects/page.tsx
// ============================================================================

import { generateMockProjects } from "@/lib/utils/mock-projects"

// ============================================================================
// REPLACE FILTERED PROJECTS LOGIC
// ============================================================================

export default function ProjectsPage() {
  // ... existing code ...

  // ORIGINAL CODE (comment out during testing):
  // const filtered = allProjects.filter(...).sort(...)

  // TEST CODE (uncomment to test):
  const filtered = (() => {
    // Generate mock data for testing
    const testMode = process.env.NODE_ENV === 'development'
    const mockCount = 500 // Try: 20, 50, 100, 500, 1000

    if (testMode) {
      console.log(`🧪 TEST MODE: Generating ${mockCount} mock projects`)
      const mockProjects = generateMockProjects(mockCount)

      // Mix with real data if any
      const combined = [...allProjects, ...mockProjects]

      // Apply existing filter/sort logic
      return combined
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
          switch (sort) {
            case "newest":
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            case "oldest":
              return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            case "name":
              return a.name.localeCompare(b.name)
            default:
              return 0
          }
        })
    }

    // Production code (original)
    return allProjects
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
        switch (sort) {
          case "newest":
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          case "oldest":
            return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          case "name":
            return a.name.localeCompare(b.name)
          default:
            return 0
        }
      })
  })()

  // ============================================================================
  // ADD PERFORMANCE MONITORING
  // ============================================================================

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log project stats
      console.group('📊 ProjectsList Stats')
      console.log('Total projects:', filtered.length)
      console.log('View mode:', viewMode)
      console.log('Virtualization:', filtered.length >= 20 ? 'ENABLED ✅' : 'DISABLED (< 20 items)')
      console.groupEnd()

      // Count rendered DOM nodes
      setTimeout(() => {
        const virtualizedNodes = document.querySelectorAll('[data-index]').length
        const allProjectElements = document.querySelectorAll('[href^="/projects/"]').length

        console.group('🔢 DOM Node Analysis')
        console.log('Virtualized nodes (data-index):', virtualizedNodes)
        console.log('Total project links:', allProjectElements)

        if (filtered.length >= 100) {
          const efficiency = ((filtered.length - virtualizedNodes) / filtered.length * 100).toFixed(1)
          console.log('Efficiency:', `${efficiency}% nodes saved`)

          if (virtualizedNodes > 50) {
            console.warn('⚠️ Too many DOM nodes! Expected <50, got', virtualizedNodes)
          } else {
            console.log('✅ Virtualization working correctly!')
          }
        }
        console.groupEnd()
      }, 500)
    }
  }, [filtered.length, viewMode])

  // ============================================================================
  // ADD SCROLL PERFORMANCE MONITORING
  // ============================================================================

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      let frameCount = 0
      let lastTime = performance.now()
      let scrolling = false

      const handleScroll = () => {
        if (!scrolling) {
          scrolling = true
          console.log('🔄 Scrolling started...')
        }
      }

      const measureFPS = () => {
        if (scrolling) {
          frameCount++
          const currentTime = performance.now()

          if (currentTime - lastTime >= 1000) {
            const fps = Math.round(frameCount * 1000 / (currentTime - lastTime))
            console.log(`📊 Scroll FPS: ${fps} ${fps >= 55 ? '✅' : '⚠️ (target: 60)'}`)

            frameCount = 0
            lastTime = currentTime
            scrolling = false
          }
        }
        requestAnimationFrame(measureFPS)
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      requestAnimationFrame(measureFPS)

      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  // ... rest of component code ...
}

// ============================================================================
// CONSOLE COMMANDS FOR MANUAL TESTING
// ============================================================================

/*

Paste these in DevTools Console:

// 1. Count DOM nodes
document.querySelectorAll('[data-index]').length
// Expected: <50 for 100+ projects

// 2. Force scroll test
for (let i = 0; i < 10; i++) {
  setTimeout(() => window.scrollBy(0, 500), i * 100)
}
// Expected: Smooth scrolling, 60fps

// 3. Check container
const container = document.querySelector('.h-\\[calc\\(100vh-20rem\\)\\]')
console.log('Scroll height:', container?.scrollHeight)
console.log('Client height:', container?.clientHeight)
// Expected: Scroll height >> client height

// 4. Performance profile
performance.mark('scroll-start')
window.scrollBy(0, 1000)
setTimeout(() => {
  performance.mark('scroll-end')
  performance.measure('scroll-performance', 'scroll-start', 'scroll-end')
  console.log(performance.getEntriesByType('measure'))
}, 500)
// Expected: <100ms for scroll operation

*/

// ============================================================================
// EXPECTED RESULTS
// ============================================================================

/*

PASS Criteria:
✅ Console shows "Virtualization: ENABLED ✅" for 20+ projects
✅ DOM nodes < 50 for 100+ projects
✅ Efficiency > 90% for 100+ projects
✅ Scroll FPS ≥ 55 (target: 60)
✅ No console errors or warnings
✅ Smooth scrolling with no jank
✅ All functionality works (filter, sort, delete)

FAIL Criteria:
❌ Virtualization disabled for 20+ projects
❌ DOM nodes > 100 for 100+ projects
❌ Scroll FPS < 30
❌ Console errors
❌ Visual glitches or blank spaces
❌ Broken functionality

*/

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

/*

Expected Performance by Project Count:

| Projects | DOM Nodes | Initial Render | Memory | FPS |
|----------|-----------|----------------|--------|-----|
| 10       | ~10       | <20ms          | ~1MB   | 60  |
| 20       | ~20-30    | <50ms          | ~2MB   | 60  |
| 100      | ~25-35    | <50ms          | ~2MB   | 60  |
| 500      | ~25-35    | <100ms         | ~3MB   | 60  |
| 1000     | ~25-35    | <200ms         | ~4MB   | 55+ |

Browser DevTools Memory Profiling:
1. Open DevTools > Memory
2. Take heap snapshot (before)
3. Render 1000 projects
4. Take heap snapshot (after)
5. Compare: Should be <10MB difference

*/
