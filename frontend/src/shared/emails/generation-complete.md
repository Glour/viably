# Generation Complete Email Template

## Overview

**Purpose**: Notify users when their AI bot generation completes successfully, celebrate the achievement, and guide next actions.

**Trigger**: AI generation worker completes bot generation successfully (via Celery task completion webhook/callback).

**Target Audience**: All users who initiated bot generation.

## Props Interface

```typescript
export interface GenerationCompleteEmailProps {
  userName: string;           // User's first name for personalization
  projectName: string;        // Generated project name
  templateUsed: string;       // Template that was used
  generatedAt: string;        // ISO timestamp of generation completion
  projectUrl: string;         // Link to project page in dashboard
  deployUrl?: string;         // Optional link to deploy if already deployed
  creditsUsed: number;        // Credits used for this generation (10)
  creditsRemaining: number;   // Remaining credits after generation
  brandColor?: string;        // Optional brand color (default: #10b981)
  logoUrl?: string;           // Optional logo URL
}
```

## Usage

### Backend Integration (Python/FastAPI)

```python
from app.services.email_service import send_email
from datetime import datetime

# After successful generation
await send_email(
    to=user.email,
    subject=f"🎉 Your {project.name} bot is ready!",
    template="generation-complete",
    props={
        "userName": user.first_name,
        "projectName": project.name,
        "templateUsed": template.name,
        "generatedAt": datetime.utcnow().isoformat(),
        "projectUrl": f"https://viably.ai/projects/{project.id}",
        "deployUrl": None,  # Not deployed yet
        "creditsUsed": 10,
        "creditsRemaining": user.credits_remaining,
    }
)
```

### Email Service Integration (Node.js)

```typescript
import { GenerationCompleteEmail } from '@/emails/generation-complete';
import { sendEmail } from '@/lib/email-service';

// Send generation complete email
await sendEmail({
  to: user.email,
  subject: `🎉 Your ${projectName} bot is ready!`,
  react: <GenerationCompleteEmail
    userName={user.firstName}
    projectName={projectName}
    templateUsed={template.name}
    generatedAt={new Date().toISOString()}
    projectUrl={`https://viably.ai/projects/${projectId}`}
    creditsUsed={10}
    creditsRemaining={user.creditsRemaining}
  />,
});
```

## Preview

Run the development server to preview:

```bash
cd frontend
npm run email:dev
```

Navigate to: `http://localhost:3000/generation-complete`

## Content Structure

### 1. Header
- Viably logo (centered)

### 2. Success Icon
- Green checkmark (64x64px)

### 3. Main Heading
- "Your bot is ready, {userName}! 🎉"
- Celebratory tone

### 4. Project Details Card
- **Project Name**: Prominent display
- **Template**: Template used
- **Generated**: Timestamp (formatted)
- **Credits Used**: -10 (green color)
- **Remaining**: Current balance

### 5. Quick Actions
- **Primary CTA**: "View Project" (green button, full width)
- **Secondary CTA**: "Deploy Now" (outline button)
- **Tertiary Link**: "Generate Another Bot →"

### 6. Next Steps
1. Review your bot - Check the generated content and make adjustments
2. Test locally - Download and test your bot in development mode
3. Deploy to production - Launch your bot with one click to our cloud
4. Share with users - Get your bot URL and start engaging users

### 7. Help Text
- Links to documentation and support

### 8. Footer
- Copyright notice
- Unsubscribe link
- Email preferences link

## Design Specifications

### Color Palette
- **Primary (Success)**: `#10b981` (Green)
- **Text Primary**: `#1a1a1a`
- **Text Secondary**: `#404040`
- **Text Muted**: `#6b7280`
- **Background**: `#ffffff`
- **Card Background**: `#f9fafb`
- **Border**: `#e5e7eb`

### Typography
- **Heading**: 28px / 700 weight / 1.3 line-height
- **Body**: 16px / 400 weight / 1.6 line-height
- **Labels**: 12px / 600 weight / uppercase
- **Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

### Layout
- **Max Width**: 600px
- **Responsive**: Single-column on mobile
- **Padding**: 20px horizontal
- **Button**: Full width on mobile, max 280px on desktop

### Spacing
- **Section Spacing**: 24px - 32px
- **Element Spacing**: 16px
- **Card Padding**: 24px

## Testing Checklist

- [x] Renders correctly in Gmail (web)
- [x] Renders correctly in Gmail (mobile)
- [x] Renders correctly in Outlook (desktop)
- [x] Renders correctly in Outlook (web)
- [x] Renders correctly in Apple Mail (macOS)
- [x] Renders correctly in Apple Mail (iOS)
- [x] Renders correctly in Yahoo Mail (web)
- [x] Responsive on mobile (320px - 480px)
- [x] All links work (project URL, deploy URL, docs, support)
- [x] All buttons render correctly
- [x] Color contrast meets WCAG AA (4.5:1)
- [x] Alt text provided for images
- [x] Subject line < 50 characters
- [x] Email file size < 102KB (actual: ~12KB)
- [x] Timestamp formats correctly
- [x] Credits display correctly
- [x] Celebratory tone appropriate

## Customization

### Brand Colors

```typescript
<GenerationCompleteEmail
  // ... other props
  brandColor="#10b981"  // Override default success green
/>
```

### Logo

```typescript
<GenerationCompleteEmail
  // ... other props
  logoUrl="https://yourdomain.com/custom-logo.png"
/>
```

### With Deployment URL

If the bot is already deployed, pass the deployment URL:

```typescript
<GenerationCompleteEmail
  // ... other props
  deployUrl="https://my-bot.viably.dev"
/>
```

This will change the secondary CTA from "Deploy Now" to "Go to Deployment".

## A/B Testing Ideas

1. **CTA Variations**:
   - "View Your Bot" vs "See Your Bot" vs "View Project"
   - "Deploy Now" vs "Launch Bot" vs "Go Live"

2. **Tone Variations**:
   - More celebratory (more emojis)
   - More professional (fewer emojis)
   - Action-focused (emphasize next steps)

3. **Content Order**:
   - Quick actions above details
   - Next steps more prominent
   - Credits less prominent

4. **Visual Elements**:
   - Add screenshot of generated bot
   - Add stats (lessons count, sections count)
   - Add user testimonials

## Notes

- **Success Theme**: Green accents (#10b981) for celebratory feel
- **Action-Oriented**: Clear CTAs guide user to next steps
- **Visual Hierarchy**: Project name most prominent
- **Inline CSS**: All styles inline for cross-client compatibility
- **Responsive**: Single-column layout for mobile readability
- **Accessibility**: WCAG AA compliant, descriptive alt text
- **Performance**: Optimized images, minimal file size
- **Deliverability**: Follows email best practices for high inbox placement

## Maintenance

### When to Update

1. **New deployment platforms**: Update deploy CTA text
2. **Credit pricing changes**: Update credit display logic
3. **New features**: Add to "Next Steps" section
4. **Branding updates**: Update colors, logo, fonts
5. **A/B test winners**: Update copy based on test results

### Related Files

- `/frontend/emails/generation-complete.tsx` - Main email template
- `/frontend/emails/generation-complete.preview.tsx` - Preview component
- `/backend/app/services/email_service.py` - Email sending service
- `/backend/app/workers/generation_worker.py` - Generation completion trigger

### Integration Points

1. **Generation Worker**: Celery task completion callback
2. **Email Service**: Resend/SendGrid integration
3. **User Credits**: Credits deduction and balance check
4. **Project URLs**: Dynamic project URL generation
5. **Analytics**: Track email opens, clicks, conversions
