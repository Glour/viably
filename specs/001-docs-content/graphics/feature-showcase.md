# Feature Showcase Grid Specification

**File Name**: `feature-showcase-grid.png`
**Dimensions**: 1600px × 1200px
**Format**: PNG (optimized for web, <400KB)
**Purpose**: Showcase 4 key features of Viably platform for social media posts, blog headers

---

## Design Layout

### Overall Structure
- **Grid Layout**: 2×2 grid of feature cards
- **Card Size**: 760px × 560px each
- **Gap**: 40px between cards (both horizontal and vertical)
- **Outer Padding**: 40px on all sides
- **Background**: Dark (`#141414`) with subtle gradient overlay

### Background Design
- **Base Color**: `#141414`
- **Gradient Overlay**: Radial gradient from center
  - Center: `rgba(124, 58, 237, 0.1)`
  - Edge: `transparent`
  - Size: 80% of canvas
- **Noise Texture**: 3% opacity for premium feel

---

## Feature Cards (4 Total)

### Card Structure (Each)
- **Background**: `#1e1e2e` with subtle gradient border
- **Border**: 1px solid `rgba(124, 58, 237, 0.2)`
- **Border Radius**: 20px
- **Padding**: 48px
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)`
- **Hover State**: Glow effect with primary color (for web version)

### Card Layout (Internal)
1. **Icon** (top)
   - Size: 64px × 64px
   - Background: Gradient circle (feature-specific color)
   - Icon color: White
   - Position: Top-left corner of card content

2. **Title** (below icon)
   - Font: Space Grotesk Bold
   - Size: 36px
   - Color: White
   - Margin: 24px below icon

3. **Description** (below title)
   - Font: Inter Regular
   - Size: 18px
   - Line Height: 1.6
   - Color: `#A0A0A0`
   - Max Width: 600px
   - Margin: 16px below title

4. **Visual Element** (right side or bottom)
   - Small screenshot, icon, or illustration
   - Size: varies by feature
   - Position: Overlapping right edge or bottom-right corner

---

## Feature #1: AI Generation (Top-Left)

### Content
- **Icon**: Sparkles/Magic wand (lucide-react: `Sparkles`)
- **Icon Background**: Gradient purple-to-pink `linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)`
- **Title**: "AI-генерация за секунды"
- **Description**: "Просто опиши идею бота — наш AI создаст полностью рабочий код с database, handlers и логикой за 60 секунд"

### Visual Element
- Mini code editor mockup showing generated Python code
- Typing animation indicator (cursor)
- Lines of code with syntax highlighting (blue, purple, cyan)
- Position: Bottom-right corner, slightly overlapping card edge

### Colors
- **Primary**: `#7C3AED` (purple)
- **Accent**: `#EC4899` (pink)
- **Code Highlight**: `#2563EB` (blue)

---

## Feature #2: 6 Ready Templates (Top-Right)

### Content
- **Icon**: Grid layout icon (lucide-react: `LayoutGrid`)
- **Icon Background**: Gradient blue-to-cyan `linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)`
- **Title**: "6 готовых шаблонов"
- **Description**: "Shop, FAQ, Support, Booking, Poll, Notifications — выбери шаблон и настрой под свои задачи за пару кликов"

### Visual Element
- 6 mini template cards arranged in 2×3 grid
- Each card shows icon representing template type
- Icons: Shopping cart, Question mark, Headphones, Calendar, Check circle, Bell
- Card size: 80px × 80px each
- Position: Right side of card, vertically centered

### Colors
- **Primary**: `#2563EB` (blue)
- **Accent**: `#06B6D4` (cyan)
- **Template Icons**: White with 80% opacity

---

## Feature #3: Instant Deploy (Bottom-Left)

### Content
- **Icon**: Rocket launch (lucide-react: `Rocket`)
- **Icon Background**: Gradient cyan-to-green `linear-gradient(135deg, #06B6D4 0%, #10B981 100%)`
- **Title**: "Деплой в один клик"
- **Description**: "Автоматический деплой на наш сервер или Railway. Твой бот будет доступен 24/7 с первой минуты"

### Visual Element
- Deployment progress bar showing 100% complete
- Checkmarks for: "Code generated ✓", "Server configured ✓", "Bot deployed ✓"
- Telegram bot icon with green "online" indicator
- Position: Bottom section of card

### Colors
- **Primary**: `#06B6D4` (cyan)
- **Accent**: `#10B981` (green/success)
- **Progress Bar**: Gradient from cyan to green

---

## Feature #4: Free Credits (Bottom-Right)

### Content
- **Icon**: Coins/Credits (lucide-react: `Coins`)
- **Icon Background**: Gradient yellow-to-orange `linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)`
- **Title**: "10 бесплатных кредитов"
- **Description**: "Каждый новый пользователь получает 10 кредитов для генерации ботов. Плюс ежедневный бонус +1 кредит"

### Visual Element
- Large "10" number with coin icon
- Stacked coins illustration (3D effect)
- Small badge: "+1 ежедневно"
- Position: Right side, overlapping edge

### Colors
- **Primary**: `#FBBF24` (yellow)
- **Accent**: `#F59E0B` (warning/orange)
- **Coin Color**: Gradient gold effect

---

## Typography

### Fonts
1. **Space Grotesk Bold** (titles)
   - Size: 36px
   - Weight: 700
   - Line Height: 1.2

2. **Inter Regular** (descriptions)
   - Size: 18px
   - Weight: 400
   - Line Height: 1.6

### Text Colors
- **Titles**: `#FFFFFF` (white)
- **Descriptions**: `#A0A0A0` (muted gray)
- **Accents**: Feature-specific gradient colors

---

## Color Palette Summary

### Feature-Specific Gradients
1. **AI Generation**: Purple-to-Pink `#7C3AED → #EC4899`
2. **Templates**: Blue-to-Cyan `#2563EB → #06B6D4`
3. **Deploy**: Cyan-to-Green `#06B6D4 → #10B981`
4. **Credits**: Yellow-to-Orange `#FBBF24 → #F59E0B`

### Base Colors
- **Background**: `#141414`
- **Card Background**: `#1e1e2e`
- **Border**: `rgba(124, 58, 237, 0.2)`
- **White**: `#FFFFFF`
- **Muted**: `#A0A0A0`

---

## Visual Effects

### Card Effects
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.3)`
- **Border Glow** (subtle): `0 0 20px rgba(124, 58, 237, 0.1)`
- **Hover Glow** (for web): `0 0 40px rgba(124, 58, 237, 0.3)`

### Icon Effects
- **Gradient Background**: Feature-specific gradient
- **Icon Shadow**: `0 4px 16px rgba(0, 0, 0, 0.2)`
- **Glow**: Subtle outer glow matching gradient color

### Visual Element Effects
- **Mini Code Editor**: Slight blur on background, sharp text
- **Template Cards**: Hover scale effect (1.05x)
- **Progress Bar**: Animated gradient (optional for video)
- **Coins**: 3D shadow for depth

---

## Export Settings

### PNG Export
- Resolution: 72 DPI (web)
- Color Profile: sRGB
- Format: PNG-24 with transparency support
- Compression: Optimized (<400KB)

### Alternative Formats
- **JPEG** (for platforms not supporting PNG): 90% quality
- **WebP** (modern browsers): 85% quality, ~200KB

---

## Usage Context

- **Primary Use**: Social media posts (Twitter, LinkedIn, Facebook)
- **Secondary Use**: Blog post header image
- **Tertiary Use**: Email newsletter feature showcase
- **Alternative Crops**:
  - Individual feature cards: 760×560px each
  - Instagram post: Crop to 1080×1080px (center focus)
  - Twitter post: Use full 1600×1200px

---

## Content Text (Final Copy)

```
FEATURE 1:
Title: "AI-генерация за секунды"
Description: "Просто опиши идею бота — наш AI создаст полностью рабочий код с database, handlers и логикой за 60 секунд"

FEATURE 2:
Title: "6 готовых шаблонов"
Description: "Shop, FAQ, Support, Booking, Poll, Notifications — выбери шаблон и настрой под свои задачи за пару кликов"

FEATURE 3:
Title: "Деплой в один клик"
Description: "Автоматический деплой на наш сервер или Railway. Твой бот будет доступен 24/7 с первой минуты"

FEATURE 4:
Title: "10 бесплатных кредитов"
Description: "Каждый новый пользователь получает 10 кредитов для генерации ботов. Плюс ежедневный бонус +1 кредит"
```

---

## Accessibility Notes

- Ensure contrast ratio ≥4.5:1 for description text
- Ensure contrast ratio ≥3:1 for titles
- Provide alt text: "Viably platform features: AI generation in seconds, 6 ready templates, one-click deploy, and 10 free credits with daily bonus"

---

## Implementation Notes

1. Design in Figma with component system for easy updates
2. Use consistent padding/spacing across all cards
3. Export icons as separate SVGs for crisp rendering
4. Keep master file organized with named layers
5. Create variants for light/dark mode if needed
6. Test rendering at various sizes (Twitter preview, LinkedIn thumbnail)
