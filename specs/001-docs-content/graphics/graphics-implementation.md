# Graphics Implementation Guide

**Version**: 1.0
**Created**: 2026-02-08
**Purpose**: Step-by-step guide for creating all Viably social media graphics based on provided specifications

---

## Overview

This guide covers the practical implementation of 5 social media graphics:
1. **Hero Image** (OpenGraph/Twitter card)
2. **Feature Showcase Grid** (4 key features)
3. **Template Preview** (6 bot templates)
4. **Testimonial Cards** (3 user testimonials)
5. **Stats Infographic** (platform statistics)

Each section includes tool recommendations, workflow steps, and troubleshooting tips.

---

## Prerequisites

### Required Tools

**Design Software** (Choose one):
- **Figma** (Recommended) - Free tier sufficient, cloud-based, easy collaboration
- **Canva Pro** - User-friendly, template-based, good for non-designers
- **Adobe Photoshop** - Professional option, requires license
- **Sketch** - Mac-only, professional design tool

**Supporting Tools**:
- **Unsplash/Pexels** - Free stock photos for mockups/backgrounds
- **Lucide Icons** (lucide.dev) - Icon library matching project design system
- **Google Fonts** - Space Grotesk & Inter fonts
- **TinyPNG** (tinypng.com) - Image compression
- **Mockup Generator** - For phone/device mockups (e.g., mockuper.net, smartmockups.com)

### Design Assets

**Fonts** (Download from Google Fonts):
- Space Grotesk (Bold 700, Medium 500)
- Inter (SemiBold 600, Medium 500, Regular 400)
- JetBrains Mono (for code snippets, Monospace)

**Color Palette** (Copy to design tool):
```css
/* Primary Colors */
--purple: #7C3AED
--blue: #2563EB
--cyan: #06B6D4
--pink: #EC4899
--green: #10B981
--orange: #F59E0B

/* Backgrounds */
--bg-dark: #141414
--bg-mid: #1e1e2e
--card-bg: rgba(30, 30, 46, 0.8)

/* Text */
--white: #FFFFFF
--muted: #A0A0A0
--light-gray: #E0E0E0

/* Gradients */
Main Gradient: linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%)
Warm Gradient: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)
Cool Gradient: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)
```

**Icons** (Download from Lucide):
- Sparkles, LayoutGrid, Rocket, Coins (Feature Showcase)
- ShoppingCart, HelpCircle, Headphones, Calendar, CheckCircle2, Bell (Templates)
- Users, Bot, Zap, Activity (Stats Infographic)

---

## Implementation Workflows

### Workflow 1: Hero Image (OpenGraph 1200×630px)

**Estimated Time**: 45-60 minutes

#### Step 1: Setup Canvas
1. Create new file: 1200px × 630px
2. Set background:
   - Rectangle: Fill with gradient from `#141414` (top) to `#1e1e2e` (bottom)
   - Add noise texture layer (3-5% opacity) for depth

#### Step 2: Add Gradient Overlay
1. Create new rectangle (full canvas)
2. Apply gradient: `linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%)`
3. Set opacity: 20%
4. Apply blur: 80px (Gaussian Blur filter)

#### Step 3: Add Content (Left Section)
1. **Logo** (top-left, 60px margin):
   - Import Viably logo (if available) or create text logo
   - Size: 48px height
   - Color: White

2. **Headline** (120px from top):
   - Text: "Создай Telegram-бота"
   - Font: Space Grotesk Bold, 72px
   - Color: White
   - Line height: 1.1

3. **Sub-headline** (below headline):
   - Text: "за 60 секунд"
   - Font: Space Grotesk Medium, 56px
   - Apply text gradient (Main Gradient)
   - Line height: 1.2

4. **Tagline** (below sub-headline, 24px margin):
   - Text: "Без кода. Без знаний. Просто опиши идею."
   - Font: Inter Regular, 24px
   - Color: `#A0A0A0`

5. **CTA Badge** (bottom-left, 80px from bottom):
   - Create rounded rectangle: Radius 10px, Padding 12px 24px
   - Fill: Main Gradient
   - Add glow: Box shadow `0 0 30px rgba(124, 58, 237, 0.4)`
   - Text: "→ Попробуй бесплатно"
   - Font: Inter SemiBold, 20px, White

#### Step 4: Add Visual Element (Right Section)
1. **Phone Mockup**:
   - Download mockup from mockuper.net or smartmockups.com
   - Insert screenshot of Telegram chat (create mockup in Figma if needed)
   - Apply 3D tilt: Rotate -15° on Y-axis
   - Add glow: `0 0 60px rgba(124, 58, 237, 0.4)`

2. **Stats Badge** (floating, top-right of phone):
   - Rectangle: `rgba(124, 58, 237, 0.15)`, Border `rgba(124, 58, 237, 0.3)`
   - Padding: 12px 20px, Radius: 10px
   - Icon: Template grid icon (18px)
   - Text: "6 готовых шаблонов", Inter Medium 18px

3. **Decorative Elements**:
   - Add 5-8 small sparkle/star shapes scattered around phone
   - Color: White with 40% opacity
   - Size: 8-16px

#### Step 5: Export
1. File → Export → PNG
2. Settings: 1200×630px, 72 DPI, sRGB
3. Optimize with TinyPNG (target <300KB)
4. Save as: `hero-og-1200x630.png`

---

### Workflow 2: Feature Showcase Grid (1600×1200px)

**Estimated Time**: 90-120 minutes

#### Step 1: Setup Canvas
1. Create new file: 1600px × 1200px
2. Background: `#141414` with radial gradient overlay
   - Gradient: Center `rgba(124, 58, 237, 0.1)` → Edge transparent
   - Add noise texture (3% opacity)

#### Step 2: Create Card Component
1. Rectangle: 760px × 560px
2. Fill: `#1e1e2e`
3. Border: 1px `rgba(124, 58, 237, 0.2)`, Radius 20px
4. Shadow: `0 8px 32px rgba(0, 0, 0, 0.3)`
5. Padding: 48px

#### Step 3: Add Card Content (Repeat for each of 4 cards)

**Card Internal Structure**:
1. **Icon** (top-left):
   - Circle background: 64×64px, gradient fill (feature-specific)
   - Icon: Lucide icon, 32×32px, white color

2. **Title**:
   - Font: Space Grotesk Bold, 36px, White
   - Position: 24px below icon

3. **Description**:
   - Font: Inter Regular, 18px, Line Height 1.6
   - Color: `#A0A0A0`
   - Position: 16px below title
   - Max width: 600px

4. **Visual Element** (feature-specific):
   - See individual feature specs for details
   - Position: Bottom-right or right side

**Feature-Specific Content**:
Refer to `feature-showcase.md` for exact text, icons, and visual elements for:
1. AI Generation (Purple-Pink gradient)
2. 6 Templates (Blue-Cyan gradient)
3. Instant Deploy (Cyan-Green gradient)
4. Free Credits (Yellow-Orange gradient)

#### Step 4: Layout Cards in 2×2 Grid
1. Position cards with 40px gap
2. Ensure 40px padding from canvas edges
3. Align vertically and horizontally

#### Step 5: Export
1. Full image: `feature-showcase-grid.png` (1600×1200px)
2. Individual cards: Export each as 760×560px separately
3. Optimize all with TinyPNG (<400KB total)

---

### Workflow 3: Template Preview (1920×1080px)

**Estimated Time**: 120-150 minutes

#### Step 1: Setup Canvas
1. Create new file: 1920px × 1080px
2. Background gradient: `#0f0f0f` → `#1a1a2e`
3. Optional: Add animated mesh gradient overlay (15% opacity, blur 120px)
   - If using Figma: Use gradient mesh plugin or Paper Shaders for web version
4. Add dot grid pattern (2% opacity, 32px spacing)

#### Step 2: Add Header
1. **Title** (top-left, 80px from edges):
   - Text: "6 готовых шаблонов для любых задач"
   - Font: Space Grotesk Bold, 56px, White

2. **Subtitle** (below title, 16px margin):
   - Text: "Выбери шаблон, настрой параметры и получи рабочего бота за минуту"
   - Font: Inter Regular, 24px, `#A0A0A0`

#### Step 3: Create Template Card Component
1. Rectangle: 340px × 480px
2. Background: `rgba(30, 30, 46, 0.8)` with backdrop blur (if supported)
3. Border: 1px `rgba(255, 255, 255, 0.1)`, Radius 24px
4. Shadow: `0 12px 48px rgba(0, 0, 0, 0.4)`

**Card Structure**:
1. **Icon Section** (top 40%, 192px height):
   - Fill: Template-specific gradient (see spec)
   - Border radius: 24px 24px 0 0
   - Icon: Centered, 80×80px, white
   - Optional pattern overlay: Geometric shapes at 10% opacity

2. **Content Section** (bottom 60%, padding 32px):
   - **Name**: Space Grotesk Bold, 28px, White
   - **Description**: Inter Regular, 16px, Line Height 1.5, `#B0B0B0` (2 lines max)
   - **Stats Badge** (bottom):
     - Background: `rgba(124, 58, 237, 0.15)`
     - Border: `rgba(124, 58, 237, 0.3)`, Radius 8px
     - Padding: 8px 16px
     - Text: Inter Medium, 14px, `#A78BFA`
     - Icon + text (e.g., "⚡ 2 мин генерация")

#### Step 4: Add All 6 Template Cards
Refer to `template-preview.md` for exact content:
1. Shop Bot (Purple-Pink gradient)
2. FAQ Bot (Blue-Cyan gradient)
3. Support Bot (Cyan-Green gradient)
4. Booking Bot (Green-Lime gradient)
5. Poll Bot (Orange-Red gradient)
6. Notifications Bot (Purple Light-Pink gradient)

**Layout**: Horizontal scroll layout with 32px gaps

#### Step 5: Export
1. Full composition: `template-gallery-preview.png` (1920×1080px)
2. Individual cards: Export each as 340×480px
3. Optimize with TinyPNG (<500KB)

---

### Workflow 4: Testimonial Cards (1400×900px)

**Estimated Time**: 60-90 minutes

#### Step 1: Setup Canvas
1. Create new file: 1400px × 900px
2. Background: `#0f0f0f` with radial gradient glows
   - Add 2-3 soft circular glows: `rgba(124, 58, 237, 0.15)`, blur 200px
3. Noise texture: 2% opacity

#### Step 2: Create Testimonial Card Component
1. **Base Card**:
   - Size: Varies (420×380px, 420×440px, 420×360px)
   - Background: `rgba(30, 30, 46, 0.6)` with backdrop blur
   - Border: 1px `rgba(255, 255, 255, 0.08)`, Radius 20px
   - Shadow: `0 8px 32px rgba(0, 0, 0, 0.4)`
   - Padding: 36px

2. **Quote Icon** (top-left corner):
   - Quotation mark icon: 32×32px
   - Color: `rgba(124, 58, 237, 0.4)`

3. **Testimonial Text**:
   - Font: Inter Regular, 18px, Line Height 1.6
   - Color: `#E0E0E0`
   - Max lines: 5-6 (adjust per card)

4. **Divider Line**:
   - 1px height, `rgba(255, 255, 255, 0.1)`
   - Margin: 24px vertical

5. **Author Section**:
   - **Avatar**: Circle 56×56px, Border 2px (accent color)
   - **Name**: Space Grotesk Bold, 18px, White
   - **Role**: Inter Regular, 14px, `#A0A0A0`

6. **Rating Stars** (top-right):
   - 5 star icons, 16×16px each
   - Color: `#FBBF24` (gold)

7. **Badge** (top-right):
   - Background: Accent-specific `rgba(r, g, b, 0.15)`
   - Border: Accent color at 30% opacity
   - Padding: 8px 12px, Radius 8px
   - Text: Inter Medium, 12px

#### Step 3: Add 3 Testimonial Cards
Refer to `testimonial-cards.md` for exact content:
1. **Card 1** (Entrepreneur) - Purple accent
2. **Card 2** (Developer) - Cyan accent, tallest
3. **Card 3** (Business Owner) - Green accent

**Layout**: Staggered masonry layout with 40px gaps

#### Step 4: Source or Generate Avatars
**Options**:
- Use avataaars.com to generate consistent avatars
- Use Unsplash for professional stock photos
- Commission custom illustrations
- Use AI avatar generators (e.g., This Person Does Not Exist)

#### Step 5: Export
1. Full composition: `testimonial-cards-set.png` (1400×900px)
2. Individual cards: Export each separately
3. Optimize with TinyPNG (<350KB)

---

### Workflow 5: Stats Infographic (1600×1200px)

**Estimated Time**: 90-120 minutes

#### Step 1: Setup Canvas
1. Create new file: 1600px × 1200px
2. Background gradient: `#0a0a0a` → `#1a1a2e` → `#0f0f1e`
3. Add grid overlay: Blueprint-style, 1px lines, `rgba(124, 58, 237, 0.1)`, 64px spacing
4. Add particle effect: 30 small dots (4-8px), accent colors, 20-40% opacity

#### Step 2: Create Center Element
1. **Platform Icon**:
   - Circle: 200×200px, centered
   - Background glow: Radial gradient `rgba(124, 58, 237, 0.3)` → transparent, blur 60px
   - Icon: Viably logo or bot icon, white, centered

2. **Rotating Border** (optional for web):
   - Circular border: 3px width
   - Gradient: `conic-gradient(#7C3AED, #2563EB, #06B6D4, #7C3AED)`
   - Animation: Rotate 360° in 8s

3. **Label** (below icon, 24px margin):
   - Text: "Viably Platform Stats"
   - Font: Space Grotesk Bold, 24px, White
   - Optional subtitle: "As of February 2026", Inter Regular, 16px, `#A0A0A0`

#### Step 3: Create Stat Card Component
1. **Base Card**:
   - Size: 360px × 240px
   - Background: `rgba(30, 30, 46, 0.7)` with backdrop blur
   - Border: 2px gradient (accent-specific), Radius 20px
   - Shadow: `0 12px 40px rgba(0, 0, 0, 0.5)`
   - Padding: 40px

2. **Icon** (top-left):
   - Size: 48×48px, accent color
   - Circular gradient background: 80×80px, 20% opacity

3. **Stat Number** (center):
   - Font: Space Grotesk Bold, 72px, White
   - Position: Center of card

4. **Label** (below number, 12px margin):
   - Font: Inter Medium, 20px, `#E0E0E0`

5. **Growth Indicator** (bottom-right):
   - Background: `rgba(16, 185, 129, 0.15)`, Radius 8px
   - Icon: Up arrow, 14px
   - Text: "+XX% за месяц", Inter Regular, 14px, `#10B981`

6. **Decorative Background Number**:
   - Large faint number: Same as stat, 200px, 5% opacity, bottom-right

#### Step 4: Position 4 Stat Cards
Refer to `stats-infographic.md` for content:
1. **Top** (200px above center): Total Users (Purple)
2. **Right** (280px right): Bots Generated (Blue)
3. **Bottom** (200px below): Generation Time (Cyan)
4. **Left** (280px left): Active Bots (Green)

#### Step 5: Add Connection Lines
1. Draw thin lines from center icon to each card
2. Color: `rgba(124, 58, 237, 0.3)`, Width 2px
3. Style: Dashed or gradient fade

#### Step 6: Export
1. Full image: `stats-infographic-viably.png` (1600×1200px)
2. Individual stat cards: Export each as 360×240px
3. Optimize with TinyPNG (<400KB)

---

## Tool-Specific Tips

### Figma Tips
1. **Use Components**: Create reusable card components for consistency
2. **Auto Layout**: Use for flexible padding and spacing
3. **Gradients**: Use CSS Gradient generator plugin for complex gradients
4. **Blur Effects**: Use backdrop blur for glass morphism (Layer Blur)
5. **Export Settings**: File → Export → PNG, 2x scale for retina displays
6. **Plugins**:
   - Unsplash for stock photos
   - Iconify for Lucide icons
   - Noise & Texture for background textures
   - Remove BG for transparent backgrounds

### Canva Pro Tips
1. **Templates**: Start with blank canvas (custom dimensions)
2. **Gradients**: Use gradient tool in Fill panel
3. **Blur**: Use Photo Effects → Blur for background elements
4. **Mockups**: Use Smartmockups app integration
5. **Fonts**: Upload custom fonts (Space Grotesk, Inter) via Brand Kit
6. **Export**: Download → PNG → Recommended quality

### Photoshop Tips
1. **Gradients**: Use Gradient Tool (G) or Layer Styles
2. **Blur**: Filter → Blur → Gaussian Blur (80-120px)
3. **Glass Effect**: Use Layer Styles → Blending Options → Opacity + Blur
4. **Smart Objects**: Convert mockups to Smart Objects for easy editing
5. **Export**: File → Export → Export As → PNG, sRGB, Optimized

---

## Quality Checklist

Before exporting each graphic, verify:

**Technical**:
- [ ] Correct dimensions (exactly as specified)
- [ ] 72 DPI resolution (web standard)
- [ ] sRGB color profile
- [ ] Text is crisp (not blurry)
- [ ] File size under target (<300KB for hero, etc.)

**Design**:
- [ ] Consistent color palette (matches brand guidelines)
- [ ] Proper font weights and sizes
- [ ] Adequate contrast (text readable)
- [ ] Balanced composition (visual hierarchy)
- [ ] No spelling/grammar errors in text

**Accessibility**:
- [ ] Text contrast ratio ≥4.5:1 for body text
- [ ] Text contrast ratio ≥3:1 for large text (headlines)
- [ ] Icon-only elements have text labels
- [ ] Alt text planned for web implementation

**Cross-Platform**:
- [ ] Test preview on Twitter (dev card validator)
- [ ] Test preview on LinkedIn (post inspector)
- [ ] Test preview on Facebook (sharing debugger)
- [ ] Mobile responsive (text legible at small sizes)

---

## Troubleshooting

### Common Issues

**1. Text looks blurry after export**
- **Cause**: Incorrect scaling or low resolution
- **Solution**: Export at 2x scale in Figma, or ensure "Snap to Pixel Grid" is enabled

**2. Gradient banding (visible color steps)**
- **Cause**: Low color depth or compression
- **Solution**: Add 1-2% noise texture layer, use PNG-24 format

**3. File size too large (>500KB)**
- **Cause**: Unoptimized export
- **Solution**: Use TinyPNG compression, reduce image quality to 85-90%, flatten layers

**4. Colors look different on social media**
- **Cause**: Incorrect color profile
- **Solution**: Always use sRGB color profile, test on target platform before final export

**5. Mockup looks pixelated**
- **Cause**: Low-resolution mockup source
- **Solution**: Use high-res mockups (min 2000px width), or create custom mockup in Figma

**6. Glass morphism effect not working**
- **Cause**: Backdrop blur not supported in export
- **Solution**: Manually blur background layer behind glass element before exporting

---

## Version Control

**File Naming Convention**:
```
[graphic-name]-[version]-[date].png

Examples:
hero-og-1200x630-v1-2026-02-08.png
feature-showcase-grid-v2-2026-02-10.png
```

**Master Files**:
- Save editable master files separately (`.fig`, `.psd`, `.canva`)
- Use version control (Figma versions, Git LFS, or Dropbox versioning)
- Document major changes in version notes

**Asset Organization**:
```
/graphics/
  /master-files/      (Editable .fig, .psd, .canva files)
  /exports/           (Final PNG/JPG exports)
  /mockups/           (Phone mockups, screenshots)
  /icons/             (Individual icon SVGs)
  /fonts/             (Custom font files)
```

---

## Next Steps

After creating all 5 graphics:

1. **Review & Approval**:
   - Share preview links with team
   - Get feedback on design and copy
   - Make revisions based on feedback

2. **Optimization**:
   - Compress all images with TinyPNG
   - Verify file sizes meet targets
   - Test on multiple devices/browsers

3. **Implementation**:
   - Add OpenGraph meta tags to website (hero image)
   - Upload to social media platforms
   - Include in email templates and presentations

4. **Testing**:
   - Use Twitter Card Validator (cards-dev.twitter.com/validator)
   - Use LinkedIn Post Inspector
   - Use Facebook Sharing Debugger
   - Test mobile rendering

5. **Documentation**:
   - Update brand guidelines with new graphics
   - Create usage guide for marketing team
   - Archive master files for future updates

---

## Resources

### Design Inspiration
- **Dribbble**: Search "SaaS hero image", "feature cards", "testimonials"
- **Behance**: Search "tech infographics", "dashboard UI"
- **Mobbin**: Mobile UI patterns and inspiration
- **Land-book**: Landing page design gallery

### Stock Resources
- **Unsplash**: Free high-res photos
- **Pexels**: Free stock photos and videos
- **Lucide Icons**: Open-source icon library (matches Viably design)
- **Hero Patterns**: Free SVG background patterns

### Tools & Plugins
- **TinyPNG**: Image compression (tinypng.com)
- **Mockuper**: Free mockup generator (mockuper.net)
- **Avataaars Generator**: Consistent avatar illustrations (getavataaars.com)
- **CSS Gradient**: Gradient generator (cssgradient.io)
- **Coolors**: Color palette generator (coolors.co)

---

## Appendix: Figma Workflow Example

### Complete Figma Workflow for Hero Image

1. **Setup**:
   ```
   Create frame: 1200×630px
   Name: "Hero Image - OG Card"
   Background: #141414
   ```

2. **Background**:
   ```
   Rectangle (full frame)
   Fill: Linear gradient 180°
     Stop 1: #141414 (0%)
     Stop 2: #1e1e2e (100%)

   Add layer: Noise texture
   Opacity: 5%
   Blend mode: Overlay
   ```

3. **Gradient Overlay**:
   ```
   Rectangle (full frame)
   Fill: Linear gradient 135°
     Stop 1: #7C3AED (0%)
     Stop 2: #2563EB (50%)
     Stop 3: #06B6D4 (100%)
   Opacity: 20%
   Layer Blur: 80px
   ```

4. **Content**:
   ```
   Text: "Создай Telegram-бота"
   Font: Space Grotesk Bold
   Size: 72px
   Color: #FFFFFF
   Position: X:60, Y:120
   Line height: 1.1
   ```

5. **Export**:
   ```
   Select frame
   Export settings:
     - Format: PNG
     - Size: 1x
     - Include "…" in name: unchecked
   Export → hero-og-1200x630.png
   ```

---

**End of Implementation Guide**

For questions or clarifications, refer to individual graphic specification files:
- `hero-image.md`
- `feature-showcase.md`
- `template-preview.md`
- `testimonial-cards.md`
- `stats-infographic.md`
