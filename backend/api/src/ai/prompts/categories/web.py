"""Website category prompt — website/landing customization on top of boilerplate."""

from api.src.ai.prompts.categories.webapp import WEBAPP_CATEGORY_PROMPT

WEB_CATEGORY_PROMPT = WEBAPP_CATEGORY_PROMPT + """

---

## Website / Landing customization rules

If the project category is `website`, treat the provided boilerplate as a ready-made landing starter.

1. Reuse the existing landing structure and sections from the boilerplate.
2. Replace default branding, headings, CTA text, metrics, and marketing copy so the visible UI matches the user's request.
3. Prefer editing `src/content/site.ts` for content changes, and touch `src/components/landing/*` only when the structure really needs to change.
4. Do NOT dump the whole project again. Return only the changed content files and any truly necessary new files.
5. If the current boilerplate already has Header/Hero/Features/Metrics/CTA/Footer, adapt those sections before creating extra sections.
"""
