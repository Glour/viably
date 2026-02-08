# Hero Image Specification - OpenGraph/Twitter Card

**File Name**: `hero-og-1200x630.png`
**Dimensions**: 1200px × 630px
**Format**: PNG (optimized for web, <300KB)
**Purpose**: OpenGraph/Twitter card for social media sharing, main landing page preview

---

## Design Layout

### Background
- **Base Color**: Dark gradient from `#141414` (top) to `#1e1e2e` (bottom)
- **Gradient Overlay**: Apply Viably brand gradient with 20% opacity
  - Gradient: `linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%)`
  - Blur: 80px
- **Texture**: Subtle noise texture (5% opacity) for depth

### Content Zones

**Left Section (60% width)**:
1. **Logo**
   - Position: Top-left, 60px from edges
   - Size: 48px height
   - Color: White (#FFFFFF)

2. **Headline** (primary message)
   - Font: Space Grotesk Bold
   - Size: 72px
   - Line Height: 1.1
   - Color: White (#FFFFFF)
   - Text: "Создай Telegram-бота"
   - Position: Below logo, 120px from top

3. **Sub-headline** (secondary message)
   - Font: Space Grotesk Medium
   - Size: 56px
   - Line Height: 1.2
   - Color: Gradient text (brand gradient)
   - Text: "за 60 секунд"
   - Position: Directly below headline

4. **Tagline**
   - Font: Inter Regular
   - Size: 24px
   - Color: #A0A0A0
   - Text: "Без кода. Без знаний. Просто опиши идею."
   - Position: Below sub-headline, 24px margin

5. **CTA Badge**
   - Background: Primary gradient with glow effect
   - Font: Inter SemiBold
   - Size: 20px
   - Padding: 12px 24px
   - Radius: 10px
   - Text: "→ Попробуй бесплатно"
   - Position: Bottom-left section, 80px from bottom

**Right Section (40% width)**:
1. **Visual Element**: Mockup of Telegram bot interface
   - 3D-tilted phone mockup showing Telegram chat
   - Glow effect around phone (primary color, 40% opacity)
   - Chat shows bot responding to user
   - Floating UI elements: sparkles, code blocks, rocket

2. **Stats Badge** (floating element)
   - Background: `rgba(124, 58, 237, 0.15)` with border `rgba(124, 58, 237, 0.3)`
   - Font: Inter Medium, 18px
   - Text: "6 готовых шаблонов"
   - Position: Top-right of phone, slightly floating
   - Icon: Template grid icon

---

## Color Palette

### Primary Colors
- **Primary Purple**: `#7C3AED` (oklch(0.541 0.281 293.009))
- **Primary Blue**: `#2563EB`
- **Cyan Accent**: `#06B6D4`
- **White**: `#FFFFFF`

### Supporting Colors
- **Background Dark**: `#141414`
- **Background Mid**: `#1e1e2e`
- **Text Muted**: `#A0A0A0`
- **Glow**: `rgba(124, 58, 237, 0.4)`

### Gradients
- **Main Gradient**: `linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%)`
- **Warm Gradient**: `linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)`

---

## Typography

### Fonts Required
1. **Space Grotesk** (Heading font)
   - Weights: Medium (500), Bold (700)
   - Source: Google Fonts
   - Usage: Headlines, sub-headlines

2. **Inter** (Body font)
   - Weights: Regular (400), Medium (500), SemiBold (600)
   - Source: Google Fonts
   - Usage: Tagline, CTA, badges

### Text Hierarchy
- **H1** (Main headline): Space Grotesk Bold, 72px
- **H2** (Sub-headline): Space Grotesk Medium, 56px with gradient
- **Body** (Tagline): Inter Regular, 24px
- **CTA**: Inter SemiBold, 20px

---

## Visual Effects

### Glow Effects
- **Primary Glow**: `box-shadow: 0 0 60px rgba(124, 58, 237, 0.4)`
- **Accent Glow**: `box-shadow: 0 0 40px rgba(37, 99, 235, 0.3)`

### Blur & Filters
- **Gradient Overlay**: `blur(80px) saturate(120%)`
- **Phone Shadow**: `0 20px 60px rgba(0, 0, 0, 0.5)`

### Decorative Elements
- Floating particles (small dots/stars) scattered around phone
- Subtle grid pattern in background (5% opacity)
- Radial gradient spotlight effect from top-right

---

## Content Text (Final Copy)

```
HEADLINE: "Создай Telegram-бота"
SUB-HEADLINE: "за 60 секунд"
TAGLINE: "Без кода. Без знаний. Просто опиши идею."
CTA: "→ Попробуй бесплатно"
BADGE: "6 готовых шаблонов"
```

---

## Usage Context

- **Primary Use**: OpenGraph meta tag for viably.ai homepage
- **Secondary Use**: Twitter card preview
- **Tertiary Use**: LinkedIn post preview, Facebook sharing
- **Alternative Sizes**:
  - Twitter Summary Large: 1200×628px (use this spec)
  - Facebook: 1200×630px (this spec)
  - LinkedIn: 1200×627px (crop 3px top/bottom)

---

## Export Settings

### PNG Export
- Resolution: 72 DPI (web)
- Color Profile: sRGB
- Compression: Optimized for web (<300KB target)

### Optimization
- Use TinyPNG or ImageOptim for final compression
- Target file size: 250-300KB
- Ensure text remains crisp at 100% zoom

---

## Accessibility Notes

- Ensure text contrast ratio ≥4.5:1 for body text
- Ensure text contrast ratio ≥3:1 for large text (headlines)
- Provide alt text: "Viably - Create Telegram bots in 60 seconds without coding. Six ready-made templates available."

---

## Implementation Notes

1. Use Figma/Canva with exact dimensions (1200×630px)
2. Export phone mockup separately as high-res PNG
3. Apply gradient overlay in layers for easier editing
4. Keep editable text layers for A/B testing variations
5. Save master file as `.psd` or `.fig` for future updates
