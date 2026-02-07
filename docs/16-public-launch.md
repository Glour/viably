# Launch Module: Public Launch & Marketing

## Описание
Открытие регистрации, ProductHunt launch, marketing blitz, community outreach. Цель: 500+ users в первую неделю.

## Зависимости
- 13-infrastructure (production stable)
- 14-docs-content (контент готов)
- 15-beta-testing (баги исправлены, feedback учтён)

## Сложность: Средняя (больше marketing чем код)
## Приоритет: P0 (Must)
## Estimated: 7 дней (launch week)

---

## Задачи

### Task 1: Open Registration
**Описание:** Переключение с invite-only на open

**Технические шаги:**
- Feature flag: `REGISTRATION_MODE=open`
- Убрать invite code / email whitelist
- Landing page CTA → реальная регистрация
- Waitlist users → отправить email "Viably открыт!"

**Pre-launch Checklist:**
- [ ] Production stable (no P0/P1 bugs)
- [ ] Database backed up
- [ ] Monitoring alerts настроены
- [ ] Error tracking (Sentry) working
- [ ] Rate limiting на auth endpoints
- [ ] Landing page финализирована
- [ ] Pricing page актуальная
- [ ] Stripe/payment integration (если есть) → или manual invoicing для MVP

**Acceptance Criteria:**
- [ ] Любой может зарегистрироваться
- [ ] Waitlist users уведомлены
- [ ] Система выдерживает нагрузку

### Task 2: ProductHunt Launch
**Описание:** Запуск на ProductHunt

**Подготовка (за 3-5 дней до):**
- [ ] Аккаунт ProductHunt готов (maker profile заполнен)
- [ ] Найти Hunter (опционально — можно self-submit)
- [ ] 5+ screenshots/GIFs подготовлены:
  1. Landing page hero
  2. Templates gallery
  3. Generation flow (GIF — code appearing)
  4. Deploy success (GIF — confetti)
  5. Working bot in Telegram
- [ ] Thumbnail: 240x240, eye-catching
- [ ] Tagline (60 chars max): "Create Telegram bots in 60 seconds with AI"
- [ ] Description (260 words):
  ```
  Paragraph 1: What problem it solves
  Paragraph 2: How it works (3 steps)
  Paragraph 3: Key features (templates, AI, deploy)
  Paragraph 4: Pricing (free tier available)
  Paragraph 5: CTA
  ```
- [ ] First comment (maker comment) prepared:
  - Личная история: почему создал
  - Что умеет
  - Планы
  - Приглашение к feedback

**Launch Day (00:01 PST):**
- 00:01 PST: Submit product
- 09:00 MSK: Написать друзьям/бета-тестерам: "Мы на ProductHunt! Поддержите upvote + комментом"
- Весь день: отвечать на каждый комментарий
- Crosspost: Twitter, LinkedIn, Telegram, Reddit

**Goal:** Top 5 Product of the Day, 100+ upvotes

**Acceptance Criteria:**
- [ ] ProductHunt submission live
- [ ] All media assets uploaded
- [ ] Maker comment опубликован
- [ ] Отвечено на все комменты в первые 24 часа

### Task 3: Social Media Launch Campaign
**Описание:** Координированная публикация на всех площадках

**Twitter/X:**
- Launch thread (10 tweets) — подготовлен в модуле 14
- Pin tweet с demo GIF
- Reply to relevant threads (#buildinpublic, #nocode, #telegram)
- Tag: @anthropaborador (Anthropic), @railway_app

**Reddit (Day 1-2):**
- r/SideProject: "I built an AI platform that creates Telegram bots in 60 seconds"
- r/NoCode: "Created a no-code tool for Telegram bot building"
- r/Telegram: "Introducing Viably — create bots without coding"
- r/SaaS: launch thread
- Respond to EVERY comment
- NOT salesy — genuine, ask for feedback

**Hacker News (Day 2-3):**
- "Show HN: Viably — AI-powered Telegram bot builder"
- Keep title factual
- First comment: technical details, architecture
- Respond thoughtfully to all comments

**LinkedIn (Day 1):**
- Personal post: "Today I'm launching Viably..."
- Professional angle: AI + no-code + business use cases

**Русскоязычные площадки (Day 3-4):**
- Habr: статья "Как я создал AI-платформу для Telegram-ботов"
- VC.ru: пост в "Стартапы"
- Telegram каналы: боты, стартапы, no-code, AI
- Pikabu: если аудитория подходит

**Acceptance Criteria:**
- [ ] Посты опубликованы на 5+ площадках
- [ ] Все комменты отвечены в первые 48 часов
- [ ] Трафик отслеживается (UTM метки)

### Task 4: Metrics Dashboard
**Описание:** Real-time отслеживание launch метрик

**Key Metrics (первая неделя):**
```
Acquisition:
- Total signups (target: 500)
- Traffic by source (PH, Twitter, Reddit, HN, Direct)
- Landing → Signup conversion rate

Activation:
- Users who created project (target: 40% of signups)
- Users who generated code (target: 70% of creators)
- Users who deployed (target: 50% of generators)

Revenue:
- First purchases
- MRR target: $300

Engagement:
- DAU
- Templates used (which most popular)
- Average projects per user
```

**Инструменты:**
- PostHog → funnels, events
- Vercel Analytics → traffic
- Simple admin panel (или Notion dashboard)

**Daily Standup (launch week):**
- Check metrics каждое утро
- Respond to new feedback
- Fix urgent bugs
- Adjust marketing based on what's working

**Acceptance Criteria:**
- [ ] Metrics dashboard accessible
- [ ] Key events tracked
- [ ] Daily review process

### Task 5: Post-Launch Iteration (Day 3-7)
**Описание:** Быстрые улучшения по результатам public feedback

**Expected Insights:**
- Какой template самый популярный → promote his on landing
- Где люди drop off → fix UX
- Что просят → prioritize for next sprint
- Какие ошибки → hotfixes

**Quick Wins:**
- Улучшить onboarding если confusion
- Добавить tooltips где непонятно
- Fix top 3 reported bugs
- Improve error messages
- Add loading states где забыли

**Content Iteration:**
- Update landing page headline if conversion low
- Write blog post about launch results
- Share metrics publicly (#buildinpublic)

**Acceptance Criteria:**
- [ ] Top 5 issues from public users fixed
- [ ] Conversion improvements if needed
- [ ] "Week 1 results" post published

### Task 6: Payments Integration
**Описание:** Подключение оплаты (если не сделано ранее)

**Вариант A: Stripe (международный)**
- Stripe Checkout для покупки кредитов
- Stripe Billing для подписок (Starter/Pro)
- Webhook → начисление кредитов
- Customer portal для управления подпиской

**Вариант B: ЮKassa (Россия)**
- ЮKassa checkout
- Recurring payments для подписок
- Webhook → начисление

**Минимум для launch:**
- Кнопка "Upgrade" → Stripe/ЮKassa Checkout
- Webhook обрабатывает успешную оплату
- Credits начисляются
- Receipt email отправляется

**Acceptance Criteria:**
- [ ] Пользователь может купить кредиты
- [ ] Подписка работает (recurring)
- [ ] Webhook обрабатывает платежи
- [ ] Credits начисляются после оплаты
