# Research: Documentation & Content Module

**Feature**: Documentation & Content Module
**Date**: 2026-02-08
**Branch**: 001-docs-content

## Overview

This document contains research findings for implementing documentation, blog content, email templates, and demo video features for the Viably platform.

## Technology Stack Decisions

### 1. Documentation System (Quick Start, FAQ, Template Guides)

**Decision**: Use Next.js built-in MDX support with `@next/mdx` package

**Rationale**:
- Native integration with Next.js 16.1.6 (already in use)
- MDX allows mixing Markdown with React components for interactive examples
- Server-side rendering support for fast page loads
- No additional framework needed - lightweight solution
- Supports both local MDX content and dynamic imports

**Library**:
- Package: `@next/mdx` (official Next.js package)
- Version: Compatible with Next.js 16.1.6
- Maintenance: Official Next.js package, actively maintained
- Bundle size: Minimal (integrated with Next.js)

**Alternatives considered**:
- **Nextra**: Full documentation framework, but overkill for our simple documentation needs (6 template guides + FAQ)
- **Contentlayer**: Powerful content layer, but adds unnecessary complexity for static docs
- **Plain markdown-it**: Would require custom React component integration

**Implementation approach**:
- Create `/frontend/src/app/docs/[slug]/page.tsx` for dynamic doc routes
- Store MDX files in `/frontend/content/docs/` directory
- Use `next/mdx` to compile MDX files at build time
- Add syntax highlighting with `prism-react-renderer` (already installed)

**References**:
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx)
- [Nextra Markdown](https://nextra.site/docs/guide/markdown)

---

### 2. Email Templates

**Decision**: Use React Email library for templating + Resend for sending

**Rationale**:
- React Email allows writing email templates as React components (familiar to team)
- Converts React code to HTML compatible with all major email clients
- Tested on Gmail, Apple Mail, Outlook, Yahoo, HEY, Superhuman
- Component-based architecture enables reusable email components
- Resend provides Python SDK for easy FastAPI integration
- Resend has generous free tier (3000 emails/month)

**Libraries**:
- **Frontend (templates)**:
  - Package: `react-email`
  - Version: Latest stable
  - Downloads: 100k+/week
  - Maintenance: Actively maintained by Resend team
  - TypeScript: Full TypeScript support

- **Backend (sending)**:
  - Package: `resend` (Python SDK)
  - Version: Latest stable
  - Maintenance: Official SDK by Resend
  - FastAPI integration: Native support

**Alternatives considered**:
- **MJML**: Safe cross-client choice, but requires learning new syntax (not React-based)
- **fastapi-mail**: FastAPI-specific library, but requires manual HTML template creation
- **Standard smtplib**: Too low-level, requires SMTP server management

**Implementation approach**:
- Create email components in `/frontend/emails/` directory
- Build templates: Welcome, GenerationComplete, DeploySuccess, LowCredits
- Export compiled HTML templates for backend consumption
- Backend uses Resend Python SDK to send emails with dynamic variables
- Store email service config in environment variables

**Template structure**:
```typescript
// emails/WelcomeEmail.tsx
import { Button, Html, Text } from 'react-email';

export default function WelcomeEmail({ name, dashboardUrl }) {
  return (
    <Html>
      <Text>Привет, {name}!</Text>
      <Button href={dashboardUrl}>Создать первый бот</Button>
    </Html>
  );
}
```

**Backend integration**:
```python
# backend/src/services/email_service.py
import resend

resend.api_key = settings.RESEND_API_KEY

def send_welcome_email(user_email: str, user_name: str):
    resend.Emails.send({
        "from": "Viably <hello@viably.dev>",
        "to": user_email,
        "subject": "Добро пожаловать в Viably!",
        "html": render_welcome_template(user_name)
    })
```

**References**:
- [React Email](https://react.email)
- [React Email Templates](https://react.email/templates)
- [Resend FastAPI Guide](https://resend.com/docs/send-with-fastapi)

---

### 3. Blog System

**Decision**: Use Next.js App Router with static MDX files + built-in Metadata API for SEO

**Rationale**:
- Leverage existing Next.js infrastructure (no additional CMS needed for MVP)
- Next.js 15+ Metadata API provides robust SEO meta tag management
- Static generation for fast blog post loading
- MDX allows rich content with React components
- Built-in sitemap generation for SEO

**Libraries**:
- **Content**: `@next/mdx` (same as documentation)
- **SEO**: Built-in Next.js Metadata API (no external library needed)
- **Syntax highlighting**: `prism-react-renderer` (already installed)

**Alternatives considered**:
- **next-seo**: Popular library, but Next.js 15+ built-in Metadata API is now preferred
- **Contentful/Strapi CMS**: Overkill for 3 blog posts at launch
- **Notion API**: Good for rapid prototyping, but requires external dependency

**Implementation approach**:
- Create `/frontend/src/app/blog/[slug]/page.tsx` for blog routes
- Store blog MDX files in `/frontend/content/blog/` directory
- Use `generateMetadata()` function for dynamic SEO tags
- Generate RSS feed and sitemap for SEO
- Cross-posting to external platforms (Habr, VC.ru, Dev.to) done manually

**SEO metadata example**:
```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  };
}
```

**References**:
- [Next.js Metadata API](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js SEO Guide 2026](https://www.djamware.com/post/697a19b07c935b6bb054313e/next-js-seo-optimization-guide--2026-edition)

---

### 4. Demo Video Embedding

**Decision**: Use lite-youtube-embed component for performance-optimized YouTube embedding

**Rationale**:
- Loads placeholder image initially (fast page load)
- Full YouTube player loads only when user clicks (lazy loading)
- Significantly reduces initial bundle size and page load time
- Automatically responsive with modern CSS aspect-ratio
- Improves Core Web Vitals scores

**Library**:
- Package: `lite-youtube-embed` or custom implementation
- Version: Latest stable
- Maintenance: Actively maintained
- TypeScript: Available

**Alternatives considered**:
- **Standard iframe embedding**: Simple but hurts performance (loads full YouTube player immediately)
- **next-video**: Full video player, overkill for simple YouTube embedding
- **react-player**: Feature-rich but heavier than needed

**Implementation approach**:
- Create `LiteYouTube` component in `/frontend/src/components/video/`
- Use CSS aspect-ratio: 16/9 for responsive design
- Embed on landing page and `/docs/quickstart` page
- Store video ID in environment variable or config

**Component structure**:
```typescript
// components/video/LiteYouTube.tsx
export function LiteYouTube({ videoId }: { videoId: string }) {
  return (
    <div className="aspect-video w-full">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
```

**References**:
- [Next.js Video Guide](https://nextjs.org/docs/app/guides/videos)
- [Lite YouTube Embed in Next.js](https://www.franciscomoretti.com/blog/use-a-lite-youtube-embedded-player-in-nextjs)

---

### 5. Social Media Assets Generation

**Decision**: Manual creation with design tools + static assets in Next.js public folder

**Rationale**:
- Social media assets (ProductHunt screenshots, Twitter GIFs, Reddit posts) are one-time launch content
- Manual creation with tools like Figma, Canva, ScreenToGif is faster than automated generation
- Static assets stored in `/frontend/public/social/` directory
- Text content stored in markdown files for easy editing

**No library needed** - this is content creation, not code

**Implementation approach**:
- Create `/frontend/content/social/` directory for text content
- Store visual assets in `/frontend/public/social/` directory
- Document asset requirements in `/specs/001-docs-content/social-media-checklist.md`
- Use existing screenshot tools (browser DevTools, macOS Screenshot) for captures

**Asset inventory**:
- ProductHunt: 5 screenshots/GIFs, tagline, description (200 words)
- Twitter: 10-tweet thread text + demo GIF
- Reddit: Post text for r/SideProject, r/NoCode, r/Telegram
- Telegram: Launch announcement (Russian) + demo video link

---

## Integration Points

### Frontend → Backend Email Integration

**Endpoint**: `POST /api/emails/send`

**Flow**:
1. User completes action (registration, generation, deploy)
2. Backend triggers email service
3. Email service selects appropriate template
4. Replaces variables (name, project_name, bot_username)
5. Sends via Resend API

**Error handling**:
- Log email send failures with Sentry
- Provide fallback: in-app notifications in dashboard
- Retry logic for transient failures (3 attempts with exponential backoff)

### Documentation → Landing Page Integration

**Cross-linking strategy**:
- Landing page hero: link to `/docs/quickstart`
- Template cards: link to `/docs/templates/{slug}`
- FAQ section on landing: link to `/docs/faq`
- Footer: links to blog, documentation, social media

---

## Performance Considerations

### Documentation Pages

- Static generation at build time (SSG)
- MDX compilation happens during build, not runtime
- Target: First Contentful Paint < 1.5s

### Email Sending

- Background task using Celery (already in stack)
- Non-blocking email sends
- Target: Email delivery < 5 seconds

### Blog Posts

- Static generation with ISR (Incremental Static Regeneration)
- Rebuild on content changes
- CDN caching for fast global delivery

### Demo Video

- Lazy loading with lite-youtube-embed
- Target: Reduce landing page load time by 500ms vs standard iframe

---

## Security Considerations

### Email Service

- API key stored in environment variables (never hardcoded)
- Rate limiting on email endpoints (prevent spam abuse)
- Email validation with `email-validator` (already in backend)
- Unsubscribe links for marketing emails (Resend handles automatically)

### User-Generated Content in Emails

- Sanitize user input (names, project names) before email rendering
- Prevent XSS in email templates (React Email auto-escapes)

### Documentation

- No user-generated content in docs (static MDX files)
- Content Security Policy for embedded YouTube videos

---

## Testing Strategy

### Email Templates

- Visual regression tests with email preview tools
- Cross-client testing (Gmail, Outlook, Apple Mail)
- Test variable substitution with mock data

### Documentation

- Lighthouse CI for performance testing
- Accessibility testing (WCAG 2.1 AA)
- Link validation (ensure no broken links)

### Blog SEO

- Meta tag validation
- Open Graph preview testing
- Sitemap generation verification

---

## Deployment Checklist

### Environment Variables

```bash
# Backend
RESEND_API_KEY=re_xxx

# Frontend
NEXT_PUBLIC_YOUTUBE_VIDEO_ID=xxx
NEXT_PUBLIC_SITE_URL=https://viably.dev
```

### Content Files to Create

- [ ] `/frontend/content/docs/quickstart.mdx`
- [ ] `/frontend/content/docs/templates/shop-bot.mdx`
- [ ] `/frontend/content/docs/templates/faq-bot.mdx`
- [ ] `/frontend/content/docs/templates/support-bot.mdx`
- [ ] `/frontend/content/docs/templates/booking-bot.mdx`
- [ ] `/frontend/content/docs/templates/poll-bot.mdx`
- [ ] `/frontend/content/docs/templates/notifications-bot.mdx`
- [ ] `/frontend/content/docs/faq.mdx`
- [ ] `/frontend/content/blog/create-telegram-bot-60-seconds.mdx`
- [ ] `/frontend/content/blog/telegram-bot-ideas-small-business.mdx`
- [ ] `/frontend/content/blog/viably-launch-announcement.mdx`

### Email Templates to Create

- [ ] `/frontend/emails/WelcomeEmail.tsx`
- [ ] `/frontend/emails/GenerationCompleteEmail.tsx`
- [ ] `/frontend/emails/DeploySuccessEmail.tsx`
- [ ] `/frontend/emails/LowCreditsWarning.tsx`

### Social Media Assets to Create

- [ ] ProductHunt submission draft
- [ ] Twitter thread (10 tweets)
- [ ] Reddit post template
- [ ] Telegram announcement (Russian)
- [ ] 5 screenshots for ProductHunt
- [ ] Demo GIF for social media

---

## Open Questions

**Q: Should blog posts support comments?**
**A**: Out of scope for MVP. Can add later with third-party service (Disqus, Giscus).

**Q: Should documentation have search functionality?**
**A**: Out of scope for MVP. With only 8 pages (Quick Start, 6 templates, FAQ), manual navigation is sufficient. Can add Algolia DocSearch later.

**Q: Should emails be localized (Russian/English)?**
**A**: Start with Russian for all transactional emails (primary audience). English templates can be added later based on user analytics.

**Q: How to handle demo video updates after UI changes?**
**A**: Manual process. Screen recording takes 30 minutes to re-record. Document video update process in `/docs/maintenance/video-updates.md` (create during implementation).

---

## Conclusion

All research is complete. No additional libraries beyond what's already in the stack (Next.js, React Email) are needed. Implementation can proceed to Phase 1 (Data Model & Contracts).

**Key decisions**:
- ✅ Documentation: MDX with `@next/mdx`
- ✅ Emails: React Email + Resend
- ✅ Blog: MDX + Next.js Metadata API
- ✅ Video: lite-youtube-embed pattern
- ✅ Social: Manual asset creation

**Next steps**: Create data-model.md and API contracts for email service integration.
