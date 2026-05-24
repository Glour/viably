"""Template-specific prompt for landing page generation."""

LANDING_PAGE_PROMPT = """\
## Landing Page — Template-Specific Instructions

### Core contract
Это НЕ greenfield generation. У проекта уже есть готовый landing boilerplate.
Используй boilerplate как source of truth и кастомизируй его под запрос пользователя.

### Output rules
- Возвращай ТОЛЬКО новые или изменённые файлы
- НЕ выгружай полный проект целиком
- НЕ пересобирай архитектуру, если это не требуется явно
- Предпочитай минимальный набор изменений

### Priority of edits
1. На ПЕРВОМ ответе меняй только `src/content/site.ts` для контента, брендинга, CTA, метрик и навигации
2. Не возвращай на первом ответе `src/index.css`, `index.html`, `src/pages/Home.tsx` и `src/components/landing/*`
3. Менять структуру секций или стили можно только на следующих сообщениях, если пользователь явно просит доработать шаблон
4. Не переписывай `src/pages/Home.tsx` без явной необходимости

### Content expectations
- Весь контент на русском
- Убери дефолтный boilerplate branding и generic marketing copy
- Подставь реалистичный бренд, headline, description, bullets, feature cards, metrics, CTA и footer
- Если pricing не нужен по запросу, не добавляй его
- Если нужны social proof, FAQ, partners или другие секции, сначала попробуй встроить их аккуратно поверх текущего шаблона

### Visual rules
- Можно адаптировать цвета и tone-of-voice под нишу
- Нельзя ломать базовую landing-структуру без причины
- Нельзя превращать задачу в полную перегенерацию нового лендинга

### Goal
На выходе должен получиться проект, который выглядит как качественно кастомизированный профессиональный template, а не как новая страница, сгенерированная с нуля.
"""
