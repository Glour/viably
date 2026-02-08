# Testimonial Cards Specification

**File Name**: `testimonial-cards-set.png`
**Dimensions**: 1400px × 900px (modular grid, individual cards exportable)
**Format**: PNG (optimized for web, <350KB)
**Purpose**: User testimonial graphics for social proof on landing page, social media, email campaigns

---

## Design Layout

### Overall Structure
- **Layout**: 3 testimonial cards in masonry/staggered layout
- **Card Sizes**:
  - Card 1 (Left): 420px × 380px
  - Card 2 (Center): 420px × 440px (taller)
  - Card 3 (Right): 420px × 360px
- **Card Spacing**: 40px horizontal gap, staggered vertical alignment
- **Outer Padding**: 60px on all sides
- **Background**: Dark gradient with subtle glow effects

### Background Design
- **Base Color**: `#0f0f0f`
- **Gradient Overlay**: Radial gradient from center
  - Center: `rgba(124, 58, 237, 0.08)`
  - Edge: `transparent`
- **Glow Points**: 2-3 soft circular glows at random positions
  - Color: `rgba(124, 58, 237, 0.15)`
  - Blur: 200px
- **Noise Texture**: 2% opacity for depth

---

## Testimonial Card Structure (Shared Design)

### Card Container
- **Background**: `rgba(30, 30, 46, 0.6)` with glass morphism
  - Backdrop Filter: `blur(12px) saturate(140%)`
- **Border**: 1px solid `rgba(255, 255, 255, 0.08)`
- **Border Radius**: 20px
- **Padding**: 36px
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.4)`

### Card Internal Elements

1. **Quote Icon** (top-left)
   - Icon: Quotation marks (stylized)
   - Size: 32px × 32px
   - Color: `rgba(124, 58, 237, 0.4)`
   - Position: Absolute top-left, 16px from edges

2. **Testimonial Text** (main content)
   - Font: Inter Regular
   - Size: 18px
   - Line Height: 1.6
   - Color: `#E0E0E0`
   - Max Lines: 5-6 (varies by card height)
   - Text Shadow: `0 2px 4px rgba(0, 0, 0, 0.3)`

3. **Divider Line**
   - Height: 1px
   - Color: `rgba(255, 255, 255, 0.1)`
   - Margin: 24px vertical

4. **Author Section** (bottom)
   - Layout: Horizontal flex (avatar + name/role)

   **Avatar**:
   - Size: 56px × 56px
   - Border Radius: 50% (circular)
   - Border: 2px solid `rgba(124, 58, 237, 0.3)`
   - Image: User photo or generated avatar
   - Shadow: `0 4px 12px rgba(0, 0, 0, 0.3)`

   **Author Info**:
   - **Name**:
     - Font: Space Grotesk Bold
     - Size: 18px
     - Color: White
   - **Role**:
     - Font: Inter Regular
     - Size: 14px
     - Color: `#A0A0A0`
     - Margin: 4px below name

5. **Rating Stars** (optional, top-right)
   - Icon: Star icons (filled)
   - Size: 16px each
   - Color: `#FBBF24` (gold)
   - Count: 5 stars
   - Position: Absolute top-right corner

---

## Testimonial 1: Entrepreneur (Left Card)

### Card Details
- **Size**: 420px × 380px
- **Accent Color**: Purple `#7C3AED`
- **Border Glow**: Subtle purple glow on left edge

### Content
**Testimonial Text**:
"Я запустил магазин кофе в Telegram за 5 минут. Viably сгенерировал полный код с каталогом, корзиной и оплатой. Раньше на это ушли бы недели разработки."

**Author**:
- **Name**: Алексей Морозов
- **Role**: Основатель Coffee.bot
- **Avatar**: Male avatar, professional photo (or generated avatar in purple tones)

**Rating**: ⭐⭐⭐⭐⭐ (5 stars)

### Visual Enhancements
- **Badge** (top-right): Small pill badge "Entrepreneur"
  - Background: `rgba(124, 58, 237, 0.15)`
  - Border: `rgba(124, 58, 237, 0.3)`
  - Font: Inter Medium, 12px
  - Color: `#A78BFA`

---

## Testimonial 2: Developer (Center Card - Tallest)

### Card Details
- **Size**: 420px × 440px (taller for longer quote)
- **Accent Color**: Cyan `#06B6D4`
- **Border Glow**: Subtle cyan glow on bottom edge

### Content
**Testimonial Text**:
"Как разработчик, я впечатлён качеством кода. Viably генерирует чистый Python с FastAPI, SQLAlchemy и правильной архитектурой. Я могу легко доработать бота под свои нужды. Это не просто no-code инструмент — это AI-ассистент для разработки."

**Author**:
- **Name**: Мария Петрова
- **Role**: Python Developer
- **Avatar**: Female avatar, tech-savvy look (or generated avatar in cyan tones)

**Rating**: ⭐⭐⭐⭐⭐ (5 stars)

### Visual Enhancements
- **Badge** (top-right): "Developer"
  - Background: `rgba(6, 182, 212, 0.15)`
  - Border: `rgba(6, 182, 212, 0.3)`
  - Color: `#67E8F9`

- **Code Snippet** (subtle background element):
  - Very faint code lines in background (5% opacity)
  - Position: Behind testimonial text
  - Style: Monospace font, syntax-highlighted

---

## Testimonial 3: Small Business Owner (Right Card)

### Card Details
- **Size**: 420px × 360px
- **Accent Color**: Green `#10B981`
- **Border Glow**: Subtle green glow on right edge

### Content
**Testimonial Text**:
"Я владелец салона красоты и не разбираюсь в коде. Viably помог мне создать бота для записи на услуги за пару минут. Теперь клиенты записываются сами, и я экономлю время."

**Author**:
- **Name**: Ирина Соколова
- **Role**: Владелица Beauty Studio
- **Avatar**: Female avatar, business professional (or generated avatar in green tones)

**Rating**: ⭐⭐⭐⭐⭐ (5 stars)

### Visual Enhancements
- **Badge** (top-right): "Small Business"
  - Background: `rgba(16, 185, 129, 0.15)`
  - Border: `rgba(16, 185, 129, 0.3)`
  - Color: `#6EE7B7`

---

## Typography

### Fonts
1. **Space Grotesk Bold** (author names)
   - Size: 18px
   - Weight: 700
   - Color: White

2. **Inter Regular** (testimonial text, author roles)
   - Testimonial: 18px, Line Height 1.6, `#E0E0E0`
   - Role: 14px, `#A0A0A0`

3. **Inter Medium** (badges)
   - Size: 12px
   - Color: Accent-specific (purple, cyan, green variants)

---

## Color Palette Summary

### Accent Colors (Card-Specific)
1. **Card 1 (Entrepreneur)**: Purple `#7C3AED`, Light: `#A78BFA`
2. **Card 2 (Developer)**: Cyan `#06B6D4`, Light: `#67E8F9`
3. **Card 3 (Business)**: Green `#10B981`, Light: `#6EE7B7`

### Base Colors
- **Background**: `#0f0f0f`
- **Card Background**: `rgba(30, 30, 46, 0.6)`
- **Border**: `rgba(255, 255, 255, 0.08)`
- **Text Primary**: `#E0E0E0`
- **Text Muted**: `#A0A0A0`
- **White**: `#FFFFFF`
- **Gold (stars)**: `#FBBF24`

---

## Visual Effects

### Card Effects
- **Glass Morphism**: `backdrop-filter: blur(12px) saturate(140%)`
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.4)`
- **Border Glow** (accent-specific):
  - Purple: `0 0 20px rgba(124, 58, 237, 0.2)` on left edge
  - Cyan: `0 0 20px rgba(6, 182, 212, 0.2)` on bottom edge
  - Green: `0 0 20px rgba(16, 185, 129, 0.2)` on right edge

### Avatar Effects
- **Border**: 2px solid with accent color
- **Shadow**: `0 4px 12px rgba(0, 0, 0, 0.3)`
- **Optional Glow**: Subtle accent color glow

### Background Effects
- **Radial Gradient Glow**: Multiple soft glows
- **Noise Texture**: 2% opacity
- **Vignette**: Subtle edge darkening

---

## Export Settings

### Full Composition Export
- **Format**: PNG-24 with transparency
- **Resolution**: 72 DPI (web)
- **Color Profile**: sRGB
- **Compression**: Optimized (<350KB)

### Individual Card Exports
Each card should also be exported separately:
- **Card 1**: 420×380px, `testimonial-entrepreneur.png`
- **Card 2**: 420×440px, `testimonial-developer.png`
- **Card 3**: 420×360px, `testimonial-business.png`

### Alternative Formats
- **JPEG**: 90% quality for email campaigns
- **WebP**: 85% quality, ~200KB

---

## Usage Context

- **Primary Use**: Landing page testimonials section
- **Secondary Use**: Social media proof posts (Twitter, LinkedIn)
- **Tertiary Use**: Email campaigns, newsletters
- **Alternative Layouts**:
  - **Mobile**: Stack cards vertically (single column)
  - **Instagram**: Use individual cards as separate posts (1080×1080px)
  - **Twitter**: Use full composition (1400×900px)

---

## Content Text (Final Copy)

```
TESTIMONIAL 1 (Entrepreneur):
Text: "Я запустил магазин кофе в Telegram за 5 минут. Viably сгенерировал полный код с каталогом, корзиной и оплатой. Раньше на это ушли бы недели разработки."
Author: Алексей Морозов
Role: Основатель Coffee.bot
Badge: Entrepreneur
Rating: ⭐⭐⭐⭐⭐

TESTIMONIAL 2 (Developer):
Text: "Как разработчик, я впечатлён качеством кода. Viably генерирует чистый Python с FastAPI, SQLAlchemy и правильной архитектурой. Я могу легко доработать бота под свои нужды. Это не просто no-code инструмент — это AI-ассистент для разработки."
Author: Мария Петрова
Role: Python Developer
Badge: Developer
Rating: ⭐⭐⭐⭐⭐

TESTIMONIAL 3 (Small Business):
Text: "Я владелец салона красоты и не разбираюсь в коде. Viably помог мне создать бота для записи на услуги за пару минут. Теперь клиенты записываются сами, и я экономлю время."
Author: Ирина Соколова
Role: Владелица Beauty Studio
Badge: Small Business
Rating: ⭐⭐⭐⭐⭐
```

---

## Accessibility Notes

- Ensure contrast ratio ≥4.5:1 for testimonial text
- Ensure contrast ratio ≥3:1 for author names
- Provide alt text for each card:
  - Card 1: "Testimonial from Alexey Morozov, Coffee.bot founder: Generated coffee shop bot in 5 minutes with catalog and payment system"
  - Card 2: "Testimonial from Maria Petrova, Python Developer: Impressed by clean code quality with FastAPI and SQLAlchemy architecture"
  - Card 3: "Testimonial from Irina Sokolova, Beauty Studio owner: Created booking bot in minutes without coding knowledge"

---

## Implementation Notes

1. Design in Figma with component system for card structure
2. Use consistent padding/spacing across all cards
3. Generate or source realistic avatar images (ensure licensing)
4. Alternative: Use generated avatars from avataaars.com or similar
5. Keep quote marks as decorative SVG element
6. Export stars as inline SVG for crisp rendering
7. Create hover effects for web version (subtle lift + glow)
8. Consider adding subtle animation (fade-in) for scroll reveal
9. Test text wrapping with various viewport sizes
10. Ensure badge text is legible at small sizes
