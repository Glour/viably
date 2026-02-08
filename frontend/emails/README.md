# Viably Email Templates

React Email templates for transactional emails. All templates are cross-client compatible with inline styles.

## Overview

This directory contains email templates built with [React Email](https://react.email/), a library for creating responsive, production-ready email templates using React components.

## Available Templates

### Welcome Email (`welcome.tsx`)

Sent when a new user successfully registers on Viably.

**Props:**
- `userName` (string) - User's name for personalization
- `userEmail` (string) - User's email address
- `credits` (number) - Starting credits amount (default: 100)
- `dashboardUrl` (string) - Link to user dashboard

**Usage:**
```typescript
import { WelcomeEmail } from '@/emails'

const emailHtml = render(
  <WelcomeEmail
    userName="Alex"
    userEmail="alex@example.com"
    credits={100}
    dashboardUrl="https://viably.dev/dashboard"
  />
)
```

## Reusable Components

Located in `components/` directory:

### EmailButton

Customizable CTA button with size variants.

**Props:**
- `href` (string) - Destination URL
- `children` (ReactNode) - Button text
- `backgroundColor` (string, optional) - Default: #7C3AED
- `textColor` (string, optional) - Default: #ffffff
- `size` ('small' | 'medium' | 'large', optional) - Default: 'medium'

### EmailHeader

Brand header with logo/name.

**Props:**
- `brandName` (string, optional) - Default: 'Viably'
- `backgroundColor` (string, optional) - Default: #7C3AED
- `textColor` (string, optional) - Default: #ffffff

### EmailFooter

Standard footer with links and copyright.

**Props:**
- `companyName` (string, optional) - Default: 'Viably'
- `baseUrl` (string, optional) - Default: https://viably.dev
- `supportUrl` (string, optional)
- `preferencesUrl` (string, optional)
- `showCopyright` (boolean, optional) - Default: true

## Development

### Preview Templates

Run the React Email development server:

```bash
cd frontend
npx react-email dev
```

Then open http://localhost:3000 to preview all email templates.

### Testing

```bash
npm run type-check
```

## Email Client Compatibility

All templates follow email best practices:

- ✅ **Inline CSS only** - No external stylesheets
- ✅ **Table-based layouts** - Compatible with Outlook
- ✅ **System fonts** - Web-safe font stack
- ✅ **Responsive design** - Mobile-first approach
- ✅ **Maximum width: 600px** - Optimal for all clients
- ✅ **Alt text for images** - Accessibility support

### Tested Clients

- Gmail (web, mobile)
- Outlook (desktop, web)
- Apple Mail (macOS, iOS)
- Yahoo Mail (web)
- Thunderbird

## Design Guidelines

### Brand Colors

- **Primary:** `#7C3AED` (Purple) - Main brand color
- **Success:** `#10B981` (Green) - Success states, positive actions
- **Info:** `#2563EB` (Blue) - Informational content
- **Warning:** `#F59E0B` (Amber) - Warnings, low credits

### Typography

- **Font Family:** System font stack (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)
- **Minimum Font Size:** 14px (15-16px recommended)
- **Line Height:** 1.5-1.6 for body text

### Spacing

- **Container Max Width:** 600px
- **Padding:** 32px horizontal, 24-40px vertical
- **Border Radius:** 8-12px for cards/buttons

### Accessibility

- Color contrast ratio: 4.5:1 minimum (WCAG AA)
- Alt text for all images
- Semantic HTML elements
- Clear link text (no "click here")

## Adding New Templates

1. **Create template file:** `emails/new-template.tsx`
2. **Define TypeScript interface** for props
3. **Build template** using `@react-email/components`
4. **Create preview file:** `emails/new-template.preview.tsx`
5. **Export from index:** Add to `emails/index.ts`
6. **Test thoroughly** across email clients
7. **Update this README** with template documentation

## Email Rendering

### Server-Side (Recommended)

```typescript
import { render } from '@react-email/render'
import { WelcomeEmail } from '@/emails'

const emailHtml = render(<WelcomeEmail {...props} />)
const emailText = render(<WelcomeEmail {...props} />, { plainText: true })

await sendEmail({
  to: user.email,
  subject: 'Welcome to Viably!',
  html: emailHtml,
  text: emailText,
})
```

### Plain Text Fallback

Always provide a plain text version:

```typescript
import { render } from '@react-email/render'

const plainText = render(<WelcomeEmail {...props} />, { plainText: true })
```

## Best Practices

1. **Always use inline styles** - Email clients strip external CSS
2. **Test in real email clients** - Dev preview is not enough
3. **Optimize images** - Keep total email size under 102KB (Gmail limit)
4. **Use absolute URLs** - For images and links
5. **Provide alt text** - For accessibility and blocked images
6. **Keep it simple** - Avoid complex layouts, animations
7. **Mobile-first** - Design for small screens first
8. **Test links** - Verify all URLs work before sending

## Resources

- [React Email Documentation](https://react.email/docs/introduction)
- [Email Client CSS Support](https://www.campaignmonitor.com/css/)
- [Can I Email](https://www.caniemail.com/) - CSS feature support lookup
- [Email on Acid](https://www.emailonacid.com/) - Testing tool (paid)
- [Litmus](https://www.litmus.com/) - Testing tool (paid)

## Support

For questions or issues with email templates:
- Create an issue in the project repository
- Contact the development team
- Check React Email documentation
