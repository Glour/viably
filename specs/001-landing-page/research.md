# Research: Landing Page

**Feature**: 001-landing-page
**Date**: 2026-02-06
**Status**: Complete

## Executive Summary

Landing page будет реализована как Next.js 16 приложение с использованием проверенных библиотек для анимаций, максимальной производительностью и modern best practices. Все критические компоненты (scroll animations, typing effects, glow orbs) будут использовать существующие библиотеки вместо custom implementations.

## Library Decisions

### 1. Animation Library: Motion (formerly Framer Motion)

**Decision**: Использовать Motion (`motion` npm package) для всех анимаций на странице.

**Rationale**:
- **Performance**: 18+ million monthly downloads, высокая производительность с hardware acceleration
- **Features**: Built-in поддержка scroll-triggered animations, stagger effects, gestures, layout animations
- **Developer Experience**: Declarative API, отличная TypeScript поддержка
- **Ecosystem**: Official successor к Framer Motion, активное развитие
- **Documentation**: Excellent docs с множеством примеров для landing pages

**Alternatives Considered**:
- **GSAP**: Более мощный, но тяжелее и платный для коммерческого использования
- **React Spring**: Отличная physics-based анимация, но не специализируется на scroll animations
- **Anime.js**: Легковесный, но меньше React-специфичных features

**Library**: `motion` (latest version), install via `npm install motion`

**Key APIs для Landing Page**:
```typescript
// Scroll-triggered animations
import { motion, useInView } from "motion/react"

// Viewport tracking
<motion.section
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
/>

// Stagger animations для cards
import { animate, stagger } from "motion"
animate("li", { opacity: 1 }, { delay: stagger(0.1) })
```

**Sources**:
- [Motion Official Site](https://motion.dev)
- [Motion React Docs](https://motion.dev/docs/react)
- [Syncfusion: Top React Animation Libraries 2026](https://www.syncfusion.com/blogs/post/top-react-animation-libraries)

---

### 2. Typing Animation: react-type-animation

**Decision**: Использовать `react-type-animation` для typing эффекта в демо-карточке Hero-секции.

**Rationale**:
- **Simplicity**: Straightforward API для typewriter эффектов
- **Features**: Поддержка sequences, backspace, customizable speed, repeat behavior
- **Size**: Lightweight library, не добавляет много к bundle
- **Maintenance**: Active development, регулярные updates
- **TypeScript**: Full TypeScript support

**Alternatives Considered**:
- **typed.js**: Популярная, но vanilla JS, требует wrapper для React
- **react-typing-animation**: Старая библиотека (7 лет без обновлений)
- **Motion Typewriter**: Premium feature (требует Motion+ membership)

**Library**: `react-type-animation` (latest), install via `npm install react-type-animation`

**Usage Example**:
```typescript
import { TypeAnimation } from 'react-type-animation'

<TypeAnimation
  sequence={[
    'Describe your idea...',
    1000,
    'Code is generating...',
    1000,
    'Bot is live! ✓',
    2000,
  ]}
  wrapper="span"
  speed={50}
  repeat={Infinity}
/>
```

**Sources**:
- [react-type-animation npm](https://www.npmjs.com/package/react-type-animation)
- [React Type Animation Demo](https://react-type-animation.netlify.app/)

---

### 3. Glow Orbs: Custom CSS/Canvas Implementation

**Decision**: Реализовать glow orbs через custom CSS gradient backgrounds с CSS animations + JavaScript для mouse tracking.

**Rationale**:
- **No suitable library found**: Существующие библиотеки (orbs.js, canvas-glow) либо abandoned, либо too heavy
- **Simple requirements**: Нужны только 3 статичных orbs с mouse parallax - это <50 lines code
- **Performance**: CSS gradients + transform GPU-accelerated, лучше чем canvas для простых cases
- **Customization**: Полный контроль над цветами (purple, blue, cyan) и behavior

**Alternatives Considered**:
- **orbs.js**: Не обновлялась, overkill для простых glow effects
- **canvas-glow**: Слишком generic, нет mouse tracking out-of-box
- **particles.js**: Для particle systems, не для glow orbs

**Implementation Approach**:
```typescript
// CSS gradient backgrounds with blur
.glow-orb {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.6), transparent);
  filter: blur(60px);
  pointer-events: none;
}

// Mouse tracking with Motion
const { x, y } = useMotionValue()
const orb1X = useTransform(x, [0, window.innerWidth], [-20, 20])
const orb1Y = useTransform(y, [0, window.innerHeight], [-20, 20])
```

**Sources**:
- [CSS Glowing Effects 2026](https://blog.stackfindover.com/css-glowing-effect/)
- [Motion useMotionValue Docs](https://motion.dev/docs/react-motion-value)

---

### 4. Next.js 16 Architecture

**Decision**: Использовать Next.js 16 с Turbopack, React Server Components, и modern best practices.

**Key Decisions**:
- **Bundler**: Turbopack (default в Next.js 16) для faster dev и production builds
- **Rendering**: Server Components для initial render, Client Components только для интерактивных частей
- **Caching**: New "use cache" directive для статичных секций (Templates, Pricing)
- **Images**: Next.js Image component с автоматической оптимизацией
- **CSS**: Tailwind CSS v4 (уже установлен в проекте)
- **Fonts**: `next/font` для local fonts с automatic optimization

**Performance Optimizations**:
1. **Code Splitting**: Dynamic imports для heavy components (demo card animations)
2. **Lazy Loading**: Intersection Observer через Motion's viewport tracking
3. **Image Optimization**: WebP/AVIF formats, responsive sizing, lazy loading
4. **Bundle Size**: Tree-shaking, eliminating unused CSS (Tailwind JIT)
5. **Core Web Vitals Targets**:
   - LCP < 2.5s (Hero section loads fast)
   - INP < 100ms (smooth interactions)
   - CLS < 0.1 (no layout shifts)

**Server vs Client Components Strategy**:
```typescript
// Server Components (default)
- LandingNav.tsx (static nav structure)
- Footer.tsx (static footer)
- HowItWorks.tsx (static content with client animation wrapper)

// Client Components (use "use client")
- Hero.tsx (mouse tracking, glow orbs)
- TemplatesPreview.tsx (hover effects)
- Pricing.tsx (monthly/yearly toggle)
```

**Sources**:
- [Next.js 16 Release](https://nextjs.org/blog/next-16)
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [React & Next.js Best Practices 2026](https://fabwebstudio.com/blog/react-nextjs-best-practices-2026-performance-scale)
- [Next.js Performance Optimization](https://pagepro.co/blog/nextjs-performance-optimization-in-9-steps/)

---

### 5. Responsive Design Strategy

**Decision**: Mobile-first approach с Tailwind CSS breakpoints и fluid typography.

**Breakpoints** (Tailwind defaults):
- `sm`: 640px (large phones, small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large desktops)

**Key Responsive Patterns**:
1. **Hero Section**: Stack vertically on mobile, side-by-side на desktop
2. **How It Works Cards**: Single column mobile → 3 columns desktop
3. **Templates Grid**: 1 col mobile → 2 col tablet → 3 col desktop
4. **Pricing Cards**: Stack mobile → 3 columns desktop
5. **Navigation**: Hamburger menu mobile → full menu desktop

**Fluid Typography**:
```css
/* Hero heading: 32px mobile → 56px desktop */
font-size: clamp(2rem, 5vw, 3.5rem);
```

**Accessibility**:
- `prefers-reduced-motion` media query для отключения анимаций
- Keyboard navigation для всех интерактивных элементов
- ARIA labels для screen readers
- Color contrast ratio ≥ 4.5:1 (WCAG AA)

---

## Technical Stack Summary

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Framework | Next.js | 16.x | Latest, Turbopack, React Compiler |
| Animations | Motion | latest | Best-in-class scroll animations |
| Typing Effect | react-type-animation | latest | Simple, maintained, TypeScript |
| Styling | Tailwind CSS | v4 | Already in project |
| Glow Orbs | Custom CSS/JS | N/A | <50 lines, full control |
| Icons | lucide-react | latest | Already in project |
| Fonts | next/font | built-in | Auto optimization |

---

## Performance Budget

**Target Metrics** (aligned with spec SC-003, SC-004):
- **Total Bundle Size**: < 200KB (gzipped)
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s (spec: 3s on 3G)
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Frame Rate**: 60 FPS для анимаций (spec requirement)

**Bundle Analysis**:
- Motion: ~40KB gzipped
- react-type-animation: ~5KB gzipped
- Next.js runtime: ~80KB gzipped
- Custom code + Tailwind: ~50KB gzipped
- **Total**: ~175KB (within budget ✓)

---

## Integration Points

**Existing Dependencies** (from spec):
1. **Design System** (008-design-system):
   - Tokens: CSS variables для colors, spacing, typography
   - Animations: Base animation utilities (fadeIn, slideUp)
   - Glow Orbs: May reuse patterns from design system

2. **Template Data**:
   - Source: TBD (API endpoint или static data)
   - Format: `{ id, emoji, name, costInCredits }`
   - Location: Likely `lib/data/templates.ts` или API route

3. **Pricing Data**:
   - Source: Static configuration file
   - Format: `{ name, price, features, popular, ctaLink }`
   - Location: `lib/data/pricing.ts`

**Navigation Links**:
- `/register` - Auth screens module (009-auth-screens)
- `/templates` - Templates gallery (011-templates-gallery)
- `/pricing` - Pricing details page (TBD)
- `/login` - Auth screens module

---

## Open Questions RESOLVED

All technical clarifications resolved through research:

✅ **Animation Library**: Motion (scroll-triggered, stagger, gestures)
✅ **Typing Effect**: react-type-animation (simple, maintained)
✅ **Glow Orbs**: Custom CSS/JS (<50 lines, GPU-accelerated)
✅ **Performance**: Next.js 16 + Turbopack + Server Components
✅ **Responsive**: Mobile-first Tailwind breakpoints
✅ **Accessibility**: prefers-reduced-motion + WCAG AA compliance

---

## Risk Mitigation

**Performance Risks**:
- **Risk**: Animations cause jank on low-end devices
- **Mitigation**: Use `prefers-reduced-motion`, GPU-accelerated transforms only, test on throttled CPU

**Browser Compatibility**:
- **Risk**: Older browsers don't support modern CSS
- **Mitigation**: Next.js polyfills, graceful degradation (glow orbs optional)

**Bundle Size**:
- **Risk**: Animation libraries bloat bundle
- **Mitigation**: Dynamic imports, tree-shaking, bundle analyzer в CI

**Data Dependencies**:
- **Risk**: Template/pricing data not ready
- **Mitigation**: Use mock data initially, type-safe interfaces ensure easy swap

---

## Next Steps

Phase 1 (Design & Contracts):
1. Create data-model.md (Template, PricingPlan entities)
2. Define contracts for template/pricing data APIs
3. Generate quickstart.md for implementation
4. Update CLAUDE.md with Motion + react-type-animation

Phase 2 (Tasks):
1. Break down into atomic implementation tasks
2. Define task dependencies (Nav → Hero → How It Works → etc)
3. Assign priorities based on user story priorities (P1 first)
