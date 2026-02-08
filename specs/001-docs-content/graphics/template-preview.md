# Template Gallery Preview Specification

**File Name**: `template-gallery-preview.png`
**Dimensions**: 1920px × 1080px (16:9 ratio)
**Format**: PNG (optimized for web, <500KB)
**Purpose**: Visual preview of all 6 bot templates for landing page hero, social media, presentations

---

## Design Layout

### Overall Structure
- **Layout**: Horizontal scrolling showcase with 6 template cards
- **Card Size**: 340px × 480px each
- **Card Spacing**: 32px gap between cards
- **Outer Padding**: 80px left/right, 120px top/bottom
- **Background**: Dark gradient with animated mesh gradient overlay

### Background Design
- **Base Gradient**: `linear-gradient(180deg, #0f0f0f 0%, #1a1a2e 100%)`
- **Mesh Gradient Overlay** (Paper Shaders inspired):
  - Colors: `['#7C3AED', '#2563EB', '#06B6D4', '#EC4899']`
  - Opacity: 15%
  - Blur: 120px
  - Animation: Slow swirl (0.2 speed)
- **Grid Pattern**: Subtle dot grid (2% opacity, 32px spacing)

### Header Section (Top)
- **Title**:
  - Font: Space Grotesk Bold, 56px
  - Color: White
  - Text: "6 готовых шаблонов для любых задач"
  - Position: Top-left, 80px from edges

- **Subtitle**:
  - Font: Inter Regular, 24px
  - Color: `#A0A0A0`
  - Text: "Выбери шаблон, настрой параметры и получи рабочего бота за минуту"
  - Position: Below title, 16px margin

---

## Template Cards (6 Total)

### Card Structure (Shared Design)
- **Background**: `#1e1e2e` with glass morphism effect
  - Background: `rgba(30, 30, 46, 0.8)`
  - Backdrop Filter: `blur(10px) saturate(150%)`
- **Border**: 1px solid `rgba(255, 255, 255, 0.1)`
- **Border Radius**: 24px
- **Shadow**: `0 12px 48px rgba(0, 0, 0, 0.4)`
- **Hover State**: Lift effect with glow (for web)

### Card Internal Layout
1. **Icon Section** (top 40%)
   - Background: Gradient specific to template category
   - Height: 192px
   - Border Radius: 24px 24px 0 0
   - Icon: Large centered icon (80px), white color
   - Pattern: Subtle geometric pattern overlay (10% opacity)

2. **Content Section** (bottom 60%)
   - Padding: 32px
   - Background: Card base color

3. **Template Name** (title)
   - Font: Space Grotesk Bold, 28px
   - Color: White
   - Position: Top of content section

4. **Description** (2 lines max)
   - Font: Inter Regular, 16px
   - Line Height: 1.5
   - Color: `#B0B0B0`
   - Margin: 12px below title

5. **Stats Badge** (bottom)
   - Background: `rgba(124, 58, 237, 0.15)`
   - Border: 1px solid `rgba(124, 58, 237, 0.3)`
   - Padding: 8px 16px
   - Border Radius: 8px
   - Font: Inter Medium, 14px
   - Color: `#A78BFA` (light purple)
   - Icon: Small icon + text (e.g., "⚡ 2 мин генерация")

---

## Template 1: Shop Bot (E-commerce)

### Card Details
- **Icon**: Shopping Cart (lucide-react: `ShoppingCart`)
- **Icon Background Gradient**: `linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)`
- **Pattern**: Shopping bag silhouettes

### Content
- **Name**: "Shop Bot"
- **Description**: "Интернет-магазин в Telegram с каталогом, корзиной и оплатой"
- **Stats**: "⚡ 2 мин генерация"

### Colors
- **Primary**: `#7C3AED` (purple)
- **Accent**: `#EC4899` (pink)

---

## Template 2: FAQ Bot (Support)

### Card Details
- **Icon**: Question Mark Circle (lucide-react: `HelpCircle`)
- **Icon Background Gradient**: `linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)`
- **Pattern**: Question mark symbols

### Content
- **Name**: "FAQ Bot"
- **Description**: "Автоматические ответы на частые вопросы с AI-поиском"
- **Stats**: "🤖 AI-powered"

### Colors
- **Primary**: `#2563EB` (blue)
- **Accent**: `#06B6D4` (cyan)

---

## Template 3: Support Bot (Customer Service)

### Card Details
- **Icon**: Headphones (lucide-react: `Headphones`)
- **Icon Background Gradient**: `linear-gradient(135deg, #06B6D4 0%, #10B981 100%)`
- **Pattern**: Headset silhouettes

### Content
- **Name**: "Support Bot"
- **Description**: "Техподдержка с тикет-системой и эскалацией к оператору"
- **Stats**: "📊 Ticket tracking"

### Colors
- **Primary**: `#06B6D4` (cyan)
- **Accent**: `#10B981` (green)

---

## Template 4: Booking Bot (Appointments)

### Card Details
- **Icon**: Calendar (lucide-react: `Calendar`)
- **Icon Background Gradient**: `linear-gradient(135deg, #10B981 0%, #84CC16 100%)`
- **Pattern**: Calendar grid

### Content
- **Name**: "Booking Bot"
- **Description**: "Запись на услуги с выбором даты, времени и специалиста"
- **Stats**: "📅 Smart calendar"

### Colors
- **Primary**: `#10B981` (green)
- **Accent**: `#84CC16` (lime)

---

## Template 5: Poll Bot (Surveys)

### Card Details
- **Icon**: Check Circle (lucide-react: `CheckCircle2`)
- **Icon Background Gradient**: `linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)`
- **Pattern**: Checkmark grid

### Content
- **Name**: "Poll Bot"
- **Description**: "Опросы и голосования с аналитикой результатов"
- **Stats**: "📈 Analytics"

### Colors
- **Primary**: `#F59E0B` (orange)
- **Accent**: `#EF4444` (red)

---

## Template 6: Notifications Bot (Broadcasting)

### Card Details
- **Icon**: Bell (lucide-react: `Bell`)
- **Icon Background Gradient**: `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`
- **Pattern**: Bell icons

### Content
- **Name**: "Notifications Bot"
- **Description**: "Рассылка уведомлений и новостей для подписчиков"
- **Stats**: "🔔 Broadcast"

### Colors
- **Primary**: `#8B5CF6` (purple-light)
- **Accent**: `#EC4899` (pink)

---

## Typography

### Header Typography
- **Title**: Space Grotesk Bold, 56px, White
- **Subtitle**: Inter Regular, 24px, `#A0A0A0`

### Card Typography
- **Template Name**: Space Grotesk Bold, 28px, White
- **Description**: Inter Regular, 16px, Line Height 1.5, `#B0B0B0`
- **Stats Badge**: Inter Medium, 14px, `#A78BFA`

---

## Color Palette Summary

### Template-Specific Gradients
1. **Shop Bot**: Purple-Pink `#7C3AED → #EC4899`
2. **FAQ Bot**: Blue-Cyan `#2563EB → #06B6D4`
3. **Support Bot**: Cyan-Green `#06B6D4 → #10B981`
4. **Booking Bot**: Green-Lime `#10B981 → #84CC16`
5. **Poll Bot**: Orange-Red `#F59E0B → #EF4444`
6. **Notifications Bot**: Purple Light-Pink `#8B5CF6 → #EC4899`

### Base Colors
- **Background Dark**: `#0f0f0f`
- **Background Mid**: `#1a1a2e`
- **Card Background**: `rgba(30, 30, 46, 0.8)`
- **White**: `#FFFFFF`
- **Muted Gray**: `#B0B0B0`
- **Light Purple**: `#A78BFA`

---

## Visual Effects

### Card Effects
- **Glass Morphism**: `backdrop-filter: blur(10px) saturate(150%)`
- **Shadow**: `0 12px 48px rgba(0, 0, 0, 0.4)`
- **Hover Lift**: `transform: translateY(-8px)`
- **Hover Glow**: `0 16px 64px rgba(124, 58, 237, 0.3)`

### Background Effects
- **Mesh Gradient**: Animated slow swirl (Paper Shaders style)
- **Dot Grid**: 2% opacity, 32px spacing
- **Vignette**: Subtle darkening at edges

### Icon Section Effects
- **Gradient Overlay**: Feature-specific gradient
- **Pattern Overlay**: Geometric shapes at 10% opacity
- **Icon Shadow**: `0 4px 16px rgba(0, 0, 0, 0.3)`

---

## Animation Notes (For Web Version)

### Card Animations
- **Entrance**: Stagger fade-in from left (100ms delay between cards)
- **Hover**: Lift + glow effect (300ms ease-out)
- **Icon**: Subtle float animation (2s ease-in-out infinite)

### Background Animation
- **Mesh Gradient**: Continuous slow swirl (0.2 speed)
- **Dot Grid**: Optional subtle pulse effect

---

## Export Settings

### Static Image Export
- **Format**: PNG-24 with transparency
- **Resolution**: 72 DPI (web)
- **Color Profile**: sRGB
- **Compression**: Optimized (<500KB)

### Alternative Formats
- **JPEG**: 90% quality for platforms not supporting PNG
- **WebP**: 85% quality, ~300KB target

### Video/GIF Export (Optional)
- **Duration**: 8 seconds
- **Frame Rate**: 30 FPS
- **Animation**: Cards slide in from right, pause, loop
- **Format**: MP4 (H.264) or animated GIF

---

## Usage Context

- **Primary Use**: Landing page hero section, above-the-fold
- **Secondary Use**: Social media showcase (Twitter, LinkedIn header)
- **Tertiary Use**: Presentation slides, pitch decks
- **Alternative Crops**:
  - Instagram: Crop to 1080×1080px (focus center 3 cards)
  - Twitter: Use full 1920×1080px
  - Mobile: Crop to 1080×1920px (portrait, cards stacked)

---

## Content Text (Final Copy)

```
HEADER:
Title: "6 готовых шаблонов для любых задач"
Subtitle: "Выбери шаблон, настрой параметры и получи рабочего бота за минуту"

TEMPLATES:
1. Shop Bot: "Интернет-магазин в Telegram с каталогом, корзиной и оплатой" | ⚡ 2 мин генерация
2. FAQ Bot: "Автоматические ответы на частые вопросы с AI-поиском" | 🤖 AI-powered
3. Support Bot: "Техподдержка с тикет-системой и эскалацией к оператору" | 📊 Ticket tracking
4. Booking Bot: "Запись на услуги с выбором даты, времени и специалиста" | 📅 Smart calendar
5. Poll Bot: "Опросы и голосования с аналитикой результатов" | 📈 Analytics
6. Notifications Bot: "Рассылка уведомлений и новостей для подписчиков" | 🔔 Broadcast
```

---

## Accessibility Notes

- Ensure contrast ratio ≥4.5:1 for body text
- Ensure contrast ratio ≥3:1 for large text (titles)
- Provide alt text: "Viably template gallery: Six ready-made Telegram bot templates including Shop, FAQ, Support, Booking, Poll, and Notifications bots"
- Icon-only elements should have text labels (stats badges)

---

## Implementation Notes

1. Design in Figma with auto-layout for responsive variants
2. Use component system for consistent card structure
3. Export icons as separate SVGs (80×80px)
4. Keep gradient overlays on separate layers for easy editing
5. Create animated version using Figma prototyping or After Effects
6. Test rendering on various social media platforms before final export
7. Consider creating individual card exports (340×480px) for modular use
