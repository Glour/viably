# Viably Brand Guidelines

**Version**: 1.0
**Last Updated**: 2026-02-08
**Purpose**: Official brand identity guidelines for Viably platform - colors, typography, logo usage, voice & tone

---

## Brand Overview

### Mission
Viably empowers everyone to create Telegram bots in seconds without coding, democratizing bot development through AI-powered automation.

### Vision
A world where anyone can bring their bot ideas to life instantly, regardless of technical expertise.

### Brand Personality
- **Innovative**: Cutting-edge AI technology
- **Accessible**: No-code, user-friendly
- **Reliable**: Production-ready code, 24/7 uptime
- **Empowering**: Enables creators, entrepreneurs, developers

### Tone of Voice
- **Confident but not arrogant**: "Создай бота за 60 секунд" (direct, factual)
- **Friendly but professional**: Avoid overly casual slang
- **Technical but approachable**: Explain complex concepts simply
- **Action-oriented**: Use active voice, clear CTAs

---

## Logo Usage

### Primary Logo
**File**: `viably-logo-primary.svg`

**Specifications**:
- **Logotype**: Wordmark "Viably" in custom/Space Grotesk Bold
- **Icon**: Stylized bot head or rocket (if applicable)
- **Color**: Primary purple `#7C3AED` or white (depending on background)
- **Minimum Size**: 120px width (digital), 1 inch (print)

### Logo Variants

1. **Full Color Logo** (Primary):
   - Use on light backgrounds (white, light gray)
   - Color: Purple gradient or solid `#7C3AED`

2. **White Logo**:
   - Use on dark backgrounds (`#141414`, photos, colored backgrounds)
   - Color: Pure white `#FFFFFF`

3. **Monochrome Logo**:
   - Use when color is not available (print, fax, black & white)
   - Color: Black `#000000` or white `#FFFFFF`

### Clear Space
- **Minimum Clear Space**: 0.5x logo height on all sides
- No text, graphics, or other logos within clear space
- Exception: Full-bleed backgrounds (gradients, photos)

### Logo Don'ts
❌ Do not stretch or distort logo
❌ Do not change logo colors (except approved variants)
❌ Do not add effects (drop shadow, glow, outline)
❌ Do not rotate logo
❌ Do not place on busy backgrounds without sufficient contrast
❌ Do not recreate or modify logo elements

---

## Color Palette

### Primary Colors

**1. Primary Purple** (Brand Color)
- **Hex**: `#7C3AED`
- **RGB**: 124, 58, 237
- **OKLCH**: oklch(0.541 0.281 293.009)
- **Usage**: Primary buttons, links, brand elements, CTAs
- **Accessibility**: Use white text on purple (AAA contrast)

**2. Primary Blue**
- **Hex**: `#2563EB`
- **RGB**: 37, 99, 235
- **OKLCH**: oklch(0.488 0.243 264.376)
- **Usage**: Secondary accents, info states, gradient blends

**3. Cyan Accent**
- **Hex**: `#06B6D4`
- **RGB**: 6, 182, 212
- **Usage**: Success states, deployment indicators, cool accents

**4. Pink Accent**
- **Hex**: `#EC4899`
- **RGB**: 236, 72, 153
- **Usage**: Warm accents, highlights, gradient blends

### Secondary Colors

**5. Green (Success)**
- **Hex**: `#10B981`
- **RGB**: 16, 185, 129
- **Usage**: Success messages, completion states, positive metrics

**6. Orange (Warning)**
- **Hex**: `#F59E0B`
- **RGB**: 245, 158, 11
- **Usage**: Warnings, alerts, credit reminders

**7. Red (Destructive)**
- **Hex**: `#EF4444`
- **RGB**: 239, 68, 68
- **Usage**: Errors, destructive actions, critical alerts

### Neutral Colors

**8. Background Dark**
- **Hex**: `#141414`
- **Usage**: Main background (dark mode default)

**9. Background Mid**
- **Hex**: `#1e1e2e`
- **Usage**: Card backgrounds, elevated surfaces

**10. Card Background** (Glass Morphism)
- **RGBA**: `rgba(30, 30, 46, 0.8)`
- **Usage**: Cards with backdrop blur

**11. White**
- **Hex**: `#FFFFFF`
- **Usage**: Primary text on dark backgrounds, icons, accents

**12. Muted Gray**
- **Hex**: `#A0A0A0`
- **Usage**: Secondary text, subtle labels

**13. Light Gray**
- **Hex**: `#E0E0E0`
- **Usage**: Body text on dark backgrounds (high contrast)

### Brand Gradients

**Main Gradient** (Primary Brand)
```css
background: linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%);
```
- **Usage**: Hero sections, CTA buttons, brand headers

**Warm Gradient**
```css
background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%);
```
- **Usage**: E-commerce features, Shop Bot template

**Cool Gradient**
```css
background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
```
- **Usage**: Tech features, developer-focused content

### Color Usage Guidelines

**Do**:
✅ Use primary purple as main brand color (60% of UI)
✅ Use gradients for hero sections and CTAs
✅ Use dark backgrounds for main layouts (dark-first design)
✅ Maintain sufficient contrast (WCAG AA minimum, AAA preferred)
✅ Use semantic colors (green=success, red=error, orange=warning)

**Don't**:
❌ Mix too many accent colors in one component
❌ Use primary purple for body text (readability issue)
❌ Use low-contrast color combinations
❌ Use color as the only indicator (add icons/text for accessibility)

---

## Typography

### Primary Fonts

**1. Space Grotesk** (Headings)
- **Source**: Google Fonts
- **Weights**: Bold (700), Medium (500)
- **Usage**: All headings (H1-H6), hero text, card titles
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Example**:
  ```css
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700; /* Bold for H1-H2 */
  font-weight: 500; /* Medium for H3-H6 */
  ```

**2. Inter** (Body Text)
- **Source**: Google Fonts
- **Weights**: SemiBold (600), Medium (500), Regular (400)
- **Usage**: Body text, labels, buttons, descriptions
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Example**:
  ```css
  font-family: 'Inter', sans-serif;
  font-weight: 400; /* Regular for body */
  font-weight: 500; /* Medium for emphasis */
  font-weight: 600; /* SemiBold for buttons */
  ```

**3. JetBrains Mono** (Code/Monospace)
- **Source**: Google Fonts
- **Weights**: Regular (400), Medium (500)
- **Usage**: Code snippets, technical documentation, monospace labels
- **Fallback**: 'Monaco', 'Courier New', monospace
- **Example**:
  ```css
  font-family: 'JetBrains Mono', monospace;
  font-weight: 400;
  ```

### Type Scale

**Headings**:
```css
H1: Space Grotesk Bold, 72px, Line Height 1.1
H2: Space Grotesk Bold, 56px, Line Height 1.2
H3: Space Grotesk Medium, 36px, Line Height 1.2
H4: Space Grotesk Medium, 28px, Line Height 1.3
H5: Space Grotesk Medium, 24px, Line Height 1.4
H6: Space Grotesk Medium, 20px, Line Height 1.4
```

**Body Text**:
```css
Large: Inter Regular, 20px, Line Height 1.6
Medium: Inter Regular, 18px, Line Height 1.6
Base: Inter Regular, 16px, Line Height 1.5
Small: Inter Regular, 14px, Line Height 1.5
Tiny: Inter Regular, 12px, Line Height 1.4
```

**Special**:
```css
Button: Inter SemiBold, 16px
Badge: Inter Medium, 14px
Caption: Inter Regular, 12px
Code: JetBrains Mono Regular, 14px, Line Height 1.6
```

### Typography Guidelines

**Do**:
✅ Use Space Grotesk for all headings
✅ Use Inter for all body text and UI elements
✅ Maintain consistent line heights (1.5-1.6 for body)
✅ Use appropriate font weights (Bold for H1-H2, Medium for H3-H6)
✅ Set max line length to 70-80 characters for readability

**Don't**:
❌ Mix heading fonts (only Space Grotesk)
❌ Use too many font weights (stick to 3-4 weights max)
❌ Set body text smaller than 16px (accessibility)
❌ Use all caps for long text (headings only)
❌ Use italic text excessively (emphasis only)

### Text Hierarchy Example

```
[H1] Создай Telegram-бота за 60 секунд
↓
[Body Large] Без кода. Без знаний. Просто опиши идею — наш AI создаст полностью рабочий код.
↓
[Button] Попробуй бесплатно
↓
[Caption] 10 бесплатных кредитов при регистрации
```

---

## Iconography

### Icon Library
**Primary**: Lucide Icons (lucide.dev)
- **Style**: Outline, 2px stroke weight
- **Sizes**: 16px, 24px, 32px, 48px, 64px
- **Color**: Inherit from parent (white, purple, accent)

**Common Icons**:
- **Sparkles**: AI generation, magic features
- **Bot**: Bot-related features
- **Rocket**: Deploy, launch
- **Users**: Community, user stats
- **Code**: Developer features
- **Zap**: Speed, instant actions
- **Shield**: Security
- **CheckCircle**: Success, completion

### Icon Usage Guidelines

**Do**:
✅ Use consistent stroke weight (2px)
✅ Use 24px icons for UI elements
✅ Use 48-64px icons for feature cards
✅ Add subtle glow effect for accent icons
✅ Provide text labels for accessibility

**Don't**:
❌ Mix icon styles (outline vs. filled)
❌ Use icons smaller than 16px
❌ Use icons without context (label or tooltip)
❌ Distort icon aspect ratio

---

## Visual Effects

### Glass Morphism
```css
background: rgba(30, 30, 46, 0.8);
backdrop-filter: blur(10px) saturate(130%);
border: 1px solid rgba(255, 255, 255, 0.1);
```
- **Usage**: Card backgrounds, modals, overlays

### Shadows

**Card Shadow** (Default):
```css
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
```

**Button Shadow** (Hover):
```css
box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
```

**Glow Effect** (Accent):
```css
box-shadow: 0 0 40px rgba(124, 58, 237, 0.4);
```

### Border Radius

**Scale**:
```css
--radius-sm: 6px     /* Small elements (badges, tags) */
--radius-md: 8px     /* Buttons, inputs */
--radius-lg: 10px    /* Cards (default) */
--radius-xl: 14px    /* Large cards */
--radius-2xl: 18px   /* Hero sections */
--radius-3xl: 22px   /* Modals */
--radius-4xl: 26px   /* Extra large containers */
```

### Animations

**Duration**:
- **Fast**: 150ms (hover, small interactions)
- **Medium**: 300ms (transitions, modals)
- **Slow**: 500ms (page transitions, complex animations)

**Easing**:
- **Default**: `ease-in-out`
- **Bounce**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (for CTAs)
- **Smooth**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design)

**Common Animations**:
```css
/* Hover Lift */
transition: transform 300ms ease-in-out;
&:hover {
  transform: translateY(-4px);
}

/* Fade In */
animation: fadeIn 500ms ease-in-out;

/* Glow Pulse */
animation: glow-pulse 2s ease-in-out infinite;
```

---

## Imagery Guidelines

### Photography Style
- **Mood**: Professional but approachable, modern tech aesthetic
- **Color Grading**: Cool tones with purple/blue accent overlays
- **Subjects**: Diverse people, clean tech environments, Telegram interface
- **Avoid**: Stock photo clichés (handshakes, fake smiles)

### Illustrations
- **Style**: Geometric, modern, minimalist
- **Colors**: Brand palette (purple, blue, cyan)
- **Usage**: Hero sections, empty states, error pages
- **Sources**: Undraw.co (customize colors), custom illustrations

### Mockups
- **Devices**: Modern smartphones (iPhone 14/15, Pixel), MacBooks
- **Style**: Clean, minimal bezels, dark mode interfaces
- **Backgrounds**: Transparent or dark gradient
- **Usage**: Feature showcases, testimonials, demos

---

## Voice & Tone

### Writing Principles

**1. Clear and Direct**
- Use simple language (avoid jargon)
- Active voice over passive voice
- Short sentences (max 20 words)
- Example: "Create a bot in 60 seconds" (not "A bot can be created within a 60-second timeframe")

**2. Action-Oriented**
- Start with verbs: "Create", "Deploy", "Generate"
- Use strong CTAs: "Try free", "Get started", "Build now"
- Avoid weak phrases: "Maybe", "Try to", "Possibly"

**3. User-Focused**
- Address user directly: "You can", "Your bot", "Your code"
- Show benefits, not features: "Save time" (not "Fast generation")
- Empathize: "We understand", "Built for creators like you"

**4. Authentic**
- Be honest about capabilities (don't overpromise)
- Acknowledge limitations when relevant
- Show personality (but not at expense of clarity)

### Tone by Context

**Landing Page** (Confident, Inspiring):
- "Создай Telegram-бота за 60 секунд. Без кода. Без знаний."
- Emphasize speed, ease, results

**Documentation** (Helpful, Clear):
- "Follow these 5 steps to create your first bot."
- Step-by-step, patient, educational

**Error Messages** (Empathetic, Solution-Oriented):
- "Something went wrong. Let's fix this together."
- Explain what happened, offer solutions, avoid blame

**Marketing** (Exciting, Value-Driven):
- "Transform your idea into a working Telegram bot — no coding required."
- Focus on transformation, outcomes, empowerment

### Word Choice

**Prefer**:
- "Create" (not "build", "develop")
- "Generate" (for AI-powered creation)
- "Deploy" (for publishing bots)
- "Template" (not "boilerplate")
- "Credits" (not "tokens")

**Avoid**:
- Technical jargon without explanation
- Negative phrasing ("Don't worry", "No problem")
- Passive voice ("The bot was created")
- Vague terms ("Soon", "Maybe", "Possibly")

---

## Component Examples

### Button Styles

**Primary Button**:
```css
background: linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%);
color: #FFFFFF;
padding: 12px 24px;
border-radius: 10px;
font: Inter SemiBold 16px;
box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
transition: transform 300ms ease-in-out;

&:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(124, 58, 237, 0.4);
}
```

**Secondary Button**:
```css
background: rgba(124, 58, 237, 0.15);
border: 1px solid rgba(124, 58, 237, 0.3);
color: #A78BFA;
padding: 12px 24px;
border-radius: 10px;
font: Inter SemiBold 16px;

&:hover {
  background: rgba(124, 58, 237, 0.25);
  border-color: rgba(124, 58, 237, 0.5);
}
```

### Card Styles

**Glass Card**:
```css
background: rgba(30, 30, 46, 0.8);
backdrop-filter: blur(10px) saturate(130%);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 20px;
padding: 40px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
```

**Feature Card**:
```css
background: #1e1e2e;
border: 1px solid rgba(124, 58, 237, 0.2);
border-radius: 20px;
padding: 48px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

&:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(124, 58, 237, 0.2);
}
```

### Badge Styles

**Accent Badge**:
```css
background: rgba(124, 58, 237, 0.15);
border: 1px solid rgba(124, 58, 237, 0.3);
padding: 8px 16px;
border-radius: 8px;
font: Inter Medium 14px;
color: #A78BFA;
```

**Success Badge**:
```css
background: rgba(16, 185, 129, 0.15);
border: 1px solid rgba(16, 185, 129, 0.3);
padding: 8px 16px;
border-radius: 8px;
font: Inter Medium 14px;
color: #6EE7B7;
```

---

## Accessibility Standards

### Color Contrast (WCAG 2.1)

**Minimum Requirements**:
- **Body Text** (16px and below): 4.5:1 contrast ratio (AA)
- **Large Text** (18px+ or 14px+ bold): 3:1 contrast ratio (AA)
- **Interactive Elements**: 3:1 contrast ratio (AA)

**Our Standards** (Stricter):
- **Body Text**: 7:1 contrast ratio (AAA preferred)
- **Large Text**: 4.5:1 contrast ratio (AAA preferred)

**Compliant Combinations**:
✅ White text (#FFFFFF) on purple background (#7C3AED) = 4.6:1 ✓
✅ White text (#FFFFFF) on dark background (#141414) = 18.5:1 ✓
✅ Light gray text (#E0E0E0) on dark background (#141414) = 14.2:1 ✓
❌ Purple text (#7C3AED) on white background (#FFFFFF) = 4.6:1 (use for headings only)

### Keyboard Navigation
- All interactive elements must be keyboard accessible (Tab, Enter, Space)
- Visible focus indicators (outline or glow)
- Logical tab order (top to bottom, left to right)

### Screen Reader Support
- Semantic HTML (use proper heading hierarchy)
- Alt text for all images (descriptive, not decorative)
- ARIA labels for icon-only buttons
- Form labels for all inputs

### Motion Accessibility
- Respect `prefers-reduced-motion` media query
- Provide option to disable animations
- Avoid auto-playing videos without user interaction

---

## Brand Assets

### Where to Find Assets

**Logo Files**:
- `viably-logo-primary.svg` (Full color)
- `viably-logo-white.svg` (White variant)
- `viably-logo-black.svg` (Monochrome)

**Fonts**:
- Space Grotesk: [Google Fonts](https://fonts.google.com/specimen/Space+Grotesk)
- Inter: [Google Fonts](https://fonts.google.com/specimen/Inter)
- JetBrains Mono: [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)

**Icons**:
- Lucide Icons: [lucide.dev](https://lucide.dev)

**Graphics** (Created per specifications):
- Hero Image: `hero-og-1200x630.png`
- Feature Showcase: `feature-showcase-grid.png`
- Template Preview: `template-gallery-preview.png`
- Testimonials: `testimonial-cards-set.png`
- Stats Infographic: `stats-infographic-viably.png`

### Usage Permissions

**Internal Use** (Employees, Contractors):
- Free to use all brand assets for official Viably materials
- Must follow guidelines in this document

**Partners/Affiliates**:
- May use logo and approved graphics for promotional purposes
- Must get approval for custom derivative works
- Link back to viably.ai required

**Third Parties**:
- May use logo for editorial/press purposes (no trademark claims)
- May not use brand assets for commercial purposes without permission

---

## Updates & Revisions

### Version History

| Version | Date       | Changes                          | Author          |
|---------|------------|----------------------------------|-----------------|
| 1.0     | 2026-02-08 | Initial brand guidelines created | Design Team     |

### Contact

For brand guideline questions or asset requests:
- **Email**: brand@viably.ai (if applicable)
- **Slack**: #brand-design channel
- **Documentation**: Refer to this file (`brand-guidelines.md`)

### Review Schedule
- **Quarterly Review**: Every 3 months (check for outdated elements)
- **Major Updates**: When new features/products launch
- **Minor Updates**: As needed (typo fixes, clarifications)

---

**End of Brand Guidelines**

For implementation examples, see:
- `graphics-implementation.md` (How to create graphics)
- Individual graphic specification files in `/graphics/` directory
