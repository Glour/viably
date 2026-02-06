# Quickstart Guide: Landing Page Implementation

**Feature**: 001-landing-page
**Date**: 2026-02-06
**Estimated Time**: 2 days (as per original spec)

## Prerequisites

✅ Next.js 16.1.6 already installed
✅ Tailwind CSS v4 already configured
✅ TypeScript 5.x already set up
✅ Design System (008-design-system) available

**New Dependencies to Install**:
```bash
npm install motion react-type-animation
```

---

## Project Structure

```
frontend/
├── app/
│   └── (public)/
│       └── page.tsx              # Landing page route
├── components/
│   └── landing/
│       ├── landing-nav.tsx       # Sticky navigation
│       ├── hero.tsx              # Hero section with glow orbs
│       ├── how-it-works.tsx      # 3-step process cards
│       ├── templates-preview.tsx # 6 template cards grid
│       ├── pricing.tsx           # 3 pricing plans
│       └── footer.tsx            # Footer with 4 columns
├── lib/
│   ├── data/
│   │   ├── templates.ts          # Mock template data
│   │   └── pricing.ts            # Pricing plans data
│   └── hooks/
│       └── use-pricing-toggle.ts # localStorage hook for pricing
└── types/
    └── landing.ts                # TypeScript types (from contracts)
```

---

## Implementation Order

Следуйте этому порядку для минимизации зависимостей и блокировок:

### Phase 1: Foundation (Day 1 Morning)

**T001: Setup Dependencies**
- Install `motion` and `react-type-animation`
- Copy types from `contracts/data-contracts.ts` to `types/landing.ts`
- Verify build passes

**T002: Create Mock Data**
- Create `lib/data/templates.ts` with 6 mock templates
- Create `lib/data/pricing.ts` with 3 plans (Free, Starter, Pro)
- Validate with Zod schemas

**T003: Landing Page Route**
- Create `app/(public)/page.tsx`
- Add basic structure with all section placeholders
- Verify route accessible at `/`

---

### Phase 2: Navigation (Day 1 Morning)

**T004: Landing Nav Component**
- Create `components/landing/landing-nav.tsx`
- Implement sticky behavior with glass effect on scroll
- Add desktop menu: Logo | Features Pricing Docs | [Login] [Sign Up →]
- Style with Tailwind
- Test scroll behavior (transparent → glass at 100px scroll)

**T005: Responsive Nav (Mobile)**
- Add hamburger menu for mobile breakpoints
- Test on mobile viewport (< 768px)

---

### Phase 3: Hero Section (Day 1 Afternoon)

**T006: Hero Structure**
- Create `components/landing/hero.tsx` as client component
- Add heading, subtitle, CTA buttons, social proof
- Layout: flex column on mobile, side-by-side on desktop

**T007: Glow Orbs Effect**
- Implement 3 CSS gradient orbs (purple, blue, cyan)
- Add mouse tracking with Motion `useMotionValue`
- Apply parallax effect (orbs move slower than mouse)
- Test performance (should be 60 FPS)

**T008: Animated Demo Card**
- Create glass card with typing animation
- Use `react-type-animation` for code sequence
- Loop: typing → code appears → "Bot is live! ✓" → repeat
- 8-10 second cycle time

**T009: Hero Scroll Animation**
- Add scroll-triggered fadeInUp with Motion
- Test viewport detection (animates when 30% visible)

---

### Phase 4: How It Works (Day 1 Evening)

**T010: How It Works Component**
- Create `components/landing/how-it-works.tsx`
- Add section heading with gradient underline
- Create 3 step cards structure

**T011: Step Cards Styling**
- Gradient number badges (circle)
- Surface background with hover glow effect
- Icons for each step (✎, ⚡, 🚀)

**T012: Stagger Animation**
- Implement staggered fadeInUp (100ms delay per card)
- Test scroll trigger behavior

---

### Phase 5: Templates Preview (Day 2 Morning)

**T013: Templates Preview Component**
- Create `components/landing/templates-preview.tsx`
- Load data from `lib/data/templates.ts`
- Grid layout: 1 col mobile → 2 col tablet → 3 col desktop

**T014: Template Cards**
- Display emoji, name, cost
- Hover effects (lift + glow)
- Staggered appear animation

**T015: "View All" Link**
- Add link to `/templates` (gallery page)
- Style as button or text link with arrow

---

### Phase 6: Pricing Section (Day 2 Morning)

**T016: Pricing Component**
- Create `components/landing/pricing.tsx`
- Load data from `lib/data/pricing.ts`
- 3-column grid (stacks on mobile)

**T017: Pricing Toggle**
- Monthly/Yearly toggle switch
- Save preference to localStorage
- Auto-calculate prices (yearly = 20% off)

**T018: Pricing Cards Styling**
- Popular badge for Pro plan
- Gradient border for Pro plan
- CTA buttons with correct links (/register or /pricing/:plan)

**T019: Pricing Animations**
- Staggered card appearance (100ms delay)
- Smooth price transition on toggle

---

### Phase 7: Footer (Day 2 Afternoon)

**T020: Footer Component**
- Create `components/landing/footer.tsx`
- 4 columns: Product, Resources, Company, Legal
- Social icons (Twitter, GitHub, Telegram) with lucide-react

**T021: Footer Styling**
- Gradient separator line at top
- Responsive: 4 cols desktop → 2 cols tablet → 1 col mobile
- Copyright text

---

### Phase 8: Polish & Testing (Day 2 Afternoon)

**T022: Responsive Testing**
- Test all breakpoints (320px - 2560px)
- Fix any layout issues on edge cases
- Verify hamburger menu works

**T023: Accessibility**
- Add ARIA labels to interactive elements
- Test keyboard navigation (Tab order correct)
- Verify color contrast (WCAG AA)
- Add `prefers-reduced-motion` support

**T024: Performance Audit**
- Run Lighthouse on local build
- Check Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 100ms)
- Optimize images if needed (use Next.js Image)
- Verify animations run at 60 FPS

**T025: Cross-browser Testing**
- Test on Chrome, Firefox, Safari, Edge
- Fix any browser-specific issues

---

## Quick Commands

### Development
```bash
# Start dev server
npm run dev

# Open landing page
open http://localhost:3000

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run component tests (if using Vitest)
npm test components/landing

# Run accessibility tests (if using jest-axe)
npm test -- --testNamePattern="accessibility"
```

---

## Code Snippets

### 1. Basic Hero Structure

```tsx
// components/landing/hero.tsx
'use client'

import { motion, useMotionValue, useTransform } from 'motion/react'
import { TypeAnimation } from 'react-type-animation'
import { GLOW_ORB_COLORS } from '@/types/landing'

export function Hero() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Parallax for glow orbs
  const orb1X = useTransform(mouseX, [0, window.innerWidth], [-20, 20])
  const orb1Y = useTransform(mouseY, [0, window.innerHeight], [-20, 20])

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Glow Orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${GLOW_ORB_COLORS.purple}, transparent)`,
          filter: 'blur(60px)',
          left: '10%',
          top: '20%',
          x: orb1X,
          y: orb1Y,
        }}
      />

      {/* Content */}
      <div className="container mx-auto px-4">
        <h1 className="text-5xl md:text-6xl font-bold">
          Опиши идею.<br />
          Получи готовый <span className="text-gradient">бот</span>.<br />
          За 60 секунд.
        </h1>
        {/* Rest of content */}
      </div>
    </section>
  )
}
```

### 2. Scroll-Triggered Animation

```tsx
// components/landing/how-it-works.tsx
'use client'

import { motion } from 'motion/react'

export function HowItWorks() {
  return (
    <section className="py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Как это работает</h2>
      </motion.div>

      {/* Staggered cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            {/* Step card content */}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
```

### 3. Pricing Toggle with localStorage

```tsx
// lib/hooks/use-pricing-toggle.ts
'use client'

import { useState, useEffect } from 'react'
import { BillingPeriod, BILLING_PERIOD_STORAGE_KEY } from '@/types/landing'

export function usePricingToggle() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  useEffect(() => {
    const saved = localStorage.getItem(BILLING_PERIOD_STORAGE_KEY)
    if (saved === 'monthly' || saved === 'yearly') {
      setPeriod(saved)
    }
  }, [])

  const togglePeriod = (newPeriod: BillingPeriod) => {
    setPeriod(newPeriod)
    localStorage.setItem(BILLING_PERIOD_STORAGE_KEY, newPeriod)
  }

  return { period, togglePeriod }
}
```

---

## Common Gotchas

### 1. Motion Import Path
```tsx
// ✅ Correct (Motion 12.33+)
import { motion } from 'motion/react'

// ❌ Wrong (old Framer Motion)
import { motion } from 'framer-motion'
```

### 2. Server vs Client Components
```tsx
// ✅ Client component (needed for animations)
'use client'
export function Hero() { ... }

// ✅ Server component (static content)
export function Footer() { ... }
```

### 3. Window is Undefined (SSR)
```tsx
// ❌ Wrong - window not available on server
const orb1X = useTransform(mouseX, [0, window.innerWidth], [-20, 20])

// ✅ Correct - check if window exists
const orb1X = useTransform(
  mouseX,
  [0, typeof window !== 'undefined' ? window.innerWidth : 1920],
  [-20, 20]
)
```

### 4. Tailwind v4 Syntax
```tsx
// ✅ Correct (v4)
className="bg-surface text-on-surface"

// ✅ Also correct (still works)
className="bg-gray-900 text-white"
```

---

## Acceptance Criteria Checklist

Before marking feature complete, verify all acceptance criteria from spec:

### User Story 1 (Hero)
- [ ] Hero section displays heading, subtitle, 2 CTAs, social proof, demo card
- [ ] Glow orbs react to mouse position
- [ ] Demo card animation loops every 8-10 seconds

### User Story 2 (How It Works)
- [ ] 3 step cards appear with staggered animation on scroll
- [ ] Cards show hover glow effect
- [ ] User understands 3-step process

### User Story 3 (Templates)
- [ ] 6 template cards display in grid
- [ ] Staggered appear animation on scroll
- [ ] Hover effects work
- [ ] "View All" link navigates to gallery

### User Story 4 (Pricing)
- [ ] 3 plans display (Free, Starter, Pro)
- [ ] Pro plan has "Popular" badge and gradient border
- [ ] Monthly/Yearly toggle updates prices correctly
- [ ] CTA buttons link to correct pages

### User Story 5 (Navigation)
- [ ] Nav bar is sticky with glass effect after 100px scroll
- [ ] Hamburger menu shows on mobile
- [ ] All nav links work correctly

### Edge Cases
- [ ] Slow connection: animations don't block content
- [ ] JavaScript disabled: content still visible (graceful degradation)
- [ ] Small screens (< 320px): no horizontal overflow
- [ ] Animation errors: page still functional
- [ ] Rapid toggle: no race conditions in pricing

### Performance (SC-003, SC-004)
- [ ] Page loads in < 3s on 3G
- [ ] Animations run at 60 FPS
- [ ] No jank on scroll
- [ ] Lighthouse score > 90

### Responsive (FR-018, SC-007)
- [ ] All sections stack correctly on mobile
- [ ] Readable on 320px - 2560px widths
- [ ] No layout shifts (CLS < 0.1)

---

## Debugging Tips

### Animation Not Triggering
```tsx
// Add debug logging
<motion.div
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
  onViewportEnter={() => console.log('Entered viewport')}
>
```

### Glow Orbs Not Visible
```tsx
// Check z-index and pointer-events
<div className="relative z-10"> {/* Content */} </div>
<div className="absolute z-0 pointer-events-none"> {/* Orbs */} </div>
```

### localStorage Not Persisting
```tsx
// Ensure you're in client component
'use client'

// Check if window is defined
if (typeof window !== 'undefined') {
  localStorage.setItem(...)
}
```

---

## Next Steps After Implementation

1. **Visual QA**: Compare with design mocks (if available)
2. **User Testing**: Show to 5-10 users, verify SC-001 (90%+ understand product)
3. **Analytics**: Add tracking for CTA clicks, scroll depth
4. **A/B Testing**: Test different Hero headlines or CTA copy
5. **SEO**: Add meta tags, Open Graph, structured data
6. **i18n**: Prepare for localization (extract all strings)

---

## Support Resources

- **Motion Docs**: https://motion.dev/docs/react
- **Next.js 16 Docs**: https://nextjs.org/docs
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Design System**: `docs/frontend/01-design-system.md`
- **Spec**: `specs/001-landing-page/spec.md`
- **Research**: `specs/001-landing-page/research.md`

---

**Ready to implement!** Follow task order T001 → T025 for smooth development. 🚀
