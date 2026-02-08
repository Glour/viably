# Stats Infographic Specification

**File Name**: `stats-infographic-viably.png`
**Dimensions**: 1600px × 1200px
**Format**: PNG (optimized for web, <400KB)
**Purpose**: Visual infographic showcasing platform statistics for social proof, press kit, investor deck

---

## Design Layout

### Overall Structure
- **Layout**: Central focus with 4 stat cards radiating from center
- **Center Element**: Viably logo or platform icon (large, 200×200px)
- **Stat Cards**: 4 cards positioned at cardinal points (top, right, bottom, left)
- **Card Size**: 360px × 240px each
- **Background**: Dark gradient with animated data visualization elements

### Background Design
- **Base Gradient**: `linear-gradient(225deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f1e 100%)`
- **Grid Overlay**: Subtle data grid (tech aesthetic)
  - Lines: 1px, `rgba(124, 58, 237, 0.1)`
  - Spacing: 64px horizontal/vertical
  - Pattern: Blueprint-style grid
- **Particle Effect**: Small glowing dots scattered (accent colors)
  - Colors: Purple, blue, cyan
  - Opacity: 20-40%
  - Size: 4-8px
  - Count: ~30 dots
- **Connection Lines**: Thin lines connecting center to each stat card
  - Color: `rgba(124, 58, 237, 0.3)`
  - Width: 2px
  - Style: Dashed or gradient fade

---

## Center Element: Platform Icon

### Design
- **Icon**: Viably logo or stylized bot head icon
- **Size**: 200px × 200px
- **Background**: Circular gradient
  - Inner: `rgba(124, 58, 237, 0.3)`
  - Outer: `transparent`
  - Blur: 60px (soft glow)
- **Icon Color**: White with subtle gradient overlay
- **Border**: Circular border with rotating gradient
  - Border Width: 3px
  - Gradient: `conic-gradient(from 0deg, #7C3AED, #2563EB, #06B6D4, #7C3AED)`
  - Animation: Rotate 360deg in 8s

### Label (Below Icon)
- **Text**: "Viably Platform Stats"
- **Font**: Space Grotesk Bold, 24px
- **Color**: White
- **Position**: 24px below icon
- **Optional Subtitle**: "As of February 2026"
  - Font: Inter Regular, 16px
  - Color: `#A0A0A0`

---

## Stat Card Structure (Shared Design)

### Card Container
- **Size**: 360px × 240px
- **Background**: `rgba(30, 30, 46, 0.7)` with glass morphism
  - Backdrop Filter: `blur(10px) saturate(130%)`
- **Border**: 2px solid with gradient (card-specific accent)
  - Border Radius: 20px
- **Shadow**: `0 12px 40px rgba(0, 0, 0, 0.5)`
- **Padding**: 40px

### Card Internal Layout

1. **Icon** (top-left)
   - Size: 48px × 48px
   - Color: Accent color (card-specific)
   - Background: Circular gradient background
     - Size: 80px × 80px
     - Opacity: 20%
   - Position: Top-left of card

2. **Stat Number** (center, large)
   - Font: Space Grotesk Bold
   - Size: 72px
   - Color: White
   - Number Formatting: With "+" prefix for growth metrics
   - Position: Center of card, vertically aligned

3. **Stat Label** (below number)
   - Font: Inter Medium
   - Size: 20px
   - Color: `#E0E0E0`
   - Position: Below number, 12px margin

4. **Growth Indicator** (optional, bottom-right)
   - Icon: Up arrow (lucide-react: `TrendingUp`)
   - Text: "+12% за месяц"
   - Font: Inter Regular, 14px
   - Color: `#10B981` (green for positive growth)
   - Background: `rgba(16, 185, 129, 0.15)`
   - Padding: 8px 12px
   - Border Radius: 8px

5. **Decorative Element** (background)
   - Large faint number (same as stat) in background
   - Opacity: 5%
   - Size: 200px
   - Position: Bottom-right, slightly clipped

---

## Stat Card 1: Total Users (Top Position)

### Card Details
- **Position**: Top center, 200px above center icon
- **Accent Color**: Purple `#7C3AED`
- **Border Gradient**: `linear-gradient(135deg, #7C3AED 0%, #A855F6 100%)`

### Content
- **Icon**: Users group (lucide-react: `Users`)
- **Stat Number**: "1,234"
- **Label**: "Зарегистрированных пользователей"
- **Growth**: "+18% за месяц"
- **Growth Color**: Green `#10B981`

### Visual Enhancement
- **Glow Effect**: Subtle purple glow around card
  - Shadow: `0 0 40px rgba(124, 58, 237, 0.3)`

---

## Stat Card 2: Bots Generated (Right Position)

### Card Details
- **Position**: Right center, 280px right of center icon
- **Accent Color**: Blue `#2563EB`
- **Border Gradient**: `linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)`

### Content
- **Icon**: Bot/Robot (lucide-react: `Bot`)
- **Stat Number**: "3,567"
- **Label**: "Ботов сгенерировано"
- **Growth**: "+24% за месяц"
- **Growth Color**: Green `#10B981`

### Visual Enhancement
- **Glow Effect**: Subtle blue glow
  - Shadow: `0 0 40px rgba(37, 99, 235, 0.3)`
- **Pulse Animation**: Subtle scale pulse (1.0 → 1.02 → 1.0, 2s loop)

---

## Stat Card 3: Average Generation Time (Bottom Position)

### Card Details
- **Position**: Bottom center, 200px below center icon
- **Accent Color**: Cyan `#06B6D4`
- **Border Gradient**: `linear-gradient(135deg, #06B6D4 0%, #10B981 100%)`

### Content
- **Icon**: Zap/Lightning (lucide-react: `Zap`)
- **Stat Number**: "47s"
- **Label**: "Средняя генерация бота"
- **Growth**: "−8s за месяц" (improvement shown as negative, but green)
- **Growth Color**: Green `#10B981`

### Visual Enhancement
- **Glow Effect**: Subtle cyan glow
  - Shadow: `0 0 40px rgba(6, 182, 212, 0.3)`

---

## Stat Card 4: Active Bots (Left Position)

### Card Details
- **Position**: Left center, 280px left of center icon
- **Accent Color**: Green `#10B981`
- **Border Gradient**: `linear-gradient(135deg, #10B981 0%, #84CC16 100%)`

### Content
- **Icon**: Activity/Heartbeat (lucide-react: `Activity`)
- **Stat Number**: "892"
- **Label**: "Активных ботов (24/7)"
- **Growth**: "+15% за месяц"
- **Growth Color**: Green `#10B981`

### Visual Enhancement
- **Glow Effect**: Subtle green glow
  - Shadow: `0 0 40px rgba(16, 185, 129, 0.3)`

---

## Typography

### Fonts
1. **Space Grotesk Bold** (stat numbers, center label)
   - Stat Numbers: 72px
   - Center Label: 24px

2. **Inter Medium** (stat labels)
   - Size: 20px
   - Color: `#E0E0E0`

3. **Inter Regular** (growth indicators, subtitle)
   - Growth Text: 14px
   - Subtitle: 16px

---

## Color Palette Summary

### Stat-Specific Accents
1. **Total Users (Top)**: Purple `#7C3AED` → `#A855F6`
2. **Bots Generated (Right)**: Blue `#2563EB` → `#06B6D4`
3. **Generation Time (Bottom)**: Cyan `#06B6D4` → `#10B981`
4. **Active Bots (Left)**: Green `#10B981` → `#84CC16`

### Base Colors
- **Background**: `#0a0a0a` → `#1a1a2e` → `#0f0f1e` (gradient)
- **Card Background**: `rgba(30, 30, 46, 0.7)`
- **Grid Lines**: `rgba(124, 58, 237, 0.1)`
- **Connection Lines**: `rgba(124, 58, 237, 0.3)`
- **White**: `#FFFFFF`
- **Text Muted**: `#E0E0E0`
- **Growth Green**: `#10B981`

---

## Visual Effects

### Card Effects
- **Glass Morphism**: `backdrop-filter: blur(10px) saturate(130%)`
- **Shadow**: `0 12px 40px rgba(0, 0, 0, 0.5)`
- **Border Gradient**: Accent-specific gradient
- **Glow**: Accent-specific outer glow (subtle)

### Center Icon Effects
- **Rotating Border**: Conic gradient border rotation (8s loop)
- **Pulse Glow**: Subtle glow pulse (2s ease-in-out infinite)
- **Shadow**: `0 0 80px rgba(124, 58, 237, 0.4)`

### Background Effects
- **Grid Pattern**: Blueprint-style tech grid
- **Particles**: Glowing dots with accent colors
- **Connection Lines**: Dashed lines from center to cards
- **Vignette**: Edge darkening for focus

### Animation Notes (For Web/Video)
- **Card Entrance**: Fade in + slide from cardinal directions (stagger 200ms)
- **Number Count-Up**: Animated number increment from 0 to target value
- **Pulse Effect**: Subtle scale pulse on stat numbers (2s loop)
- **Particle Movement**: Slow random float animation

---

## Export Settings

### Static Image Export
- **Format**: PNG-24 with transparency
- **Resolution**: 72 DPI (web)
- **Color Profile**: sRGB
- **Compression**: Optimized (<400KB)

### Alternative Formats
- **JPEG**: 90% quality for presentations
- **WebP**: 85% quality, ~250KB
- **SVG** (optional): For scalable version (icons/text only)

### Video/Animated GIF (Optional)
- **Duration**: 6 seconds
- **Frame Rate**: 30 FPS
- **Animation**: Number count-up, particle movement, glow pulses
- **Format**: MP4 (H.264) or animated WebP

---

## Usage Context

- **Primary Use**: Landing page stats section, above-the-fold
- **Secondary Use**: Investor pitch deck, press kit
- **Tertiary Use**: Social media (Twitter/LinkedIn milestone posts)
- **Alternative Crops**:
  - Instagram Square: Crop to 1080×1080px (center focus)
  - Twitter: Use full 1600×1200px
  - Presentation Slide: Full 1600×1200px

---

## Content Text (Final Copy)

```
CENTER:
Label: "Viably Platform Stats"
Subtitle: "As of February 2026"

STAT 1 (Top - Users):
Number: "1,234"
Label: "Зарегистрированных пользователей"
Growth: "+18% за месяц"

STAT 2 (Right - Bots):
Number: "3,567"
Label: "Ботов сгенерировано"
Growth: "+24% за месяц"

STAT 3 (Bottom - Speed):
Number: "47s"
Label: "Средняя генерация бота"
Growth: "−8s за месяц"

STAT 4 (Left - Active):
Number: "892"
Label: "Активных ботов (24/7)"
Growth: "+15% за месяц"
```

**Note**: Numbers are placeholder values. Replace with real metrics before production use.

---

## Accessibility Notes

- Ensure contrast ratio ≥4.5:1 for stat labels
- Ensure contrast ratio ≥3:1 for large numbers
- Provide alt text: "Viably platform statistics: 1,234 registered users (+18%), 3,567 bots generated (+24%), 47-second average generation time (8s improvement), 892 active bots (+15%)"
- Use semantic number formatting (comma separators)
- Growth indicators should have text labels, not just icons

---

## Implementation Notes

1. Design in Figma with component system for stat cards
2. Use consistent spacing and alignment for visual balance
3. Export icons as separate SVGs (48×48px)
4. Keep stat numbers editable for easy updates
5. Create animated version using After Effects or Figma prototyping
6. Test number count-up animation timing (2-3 seconds optimal)
7. Ensure grid pattern is subtle and doesn't distract from content
8. Consider creating seasonal variants (e.g., holiday themes)
9. Export individual stat cards (360×240px) for modular use
10. Maintain consistency with brand color palette across all elements
