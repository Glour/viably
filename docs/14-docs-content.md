# Launch Module: Documentation & Content

## Описание
Документация для пользователей, контент для маркетинга (блог, видео скрипты), email templates. Всё что нужно для запуска помимо кода.

## Зависимости
- 13-infrastructure (prod URL для ссылок в документации)
- Рабочий продукт для скриншотов/примеров

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 3 дня

---

## Задачи

### Task 1: Documentation Site
**Файлы:** `docs/` (внутри frontend, или отдельный docs.viably.dev)
**Описание:** Quick start + шаблоны guides на сайте

**Вариант реализации:** Отдельные Markdown страницы в Next.js (route `/docs/*`) или Notion (быстрее для MVP).

**Страницы:**

1. **Quick Start** (`/docs/quickstart`)
   - "Создай первый бот за 5 минут"
   - Step 1: Зарегистрируйся
   - Step 2: Выбери шаблон
   - Step 3: Заполни параметры
   - Step 4: Нажми "Генерировать"
   - Step 5: Задеплой
   - Скриншоты каждого шага

2. **Templates Guides** (`/docs/templates/{slug}`)
   - Для каждого из 6 шаблонов:
     - Что это за бот
     - Какие параметры заполнять
     - Примеры конфигурации
     - Что получится в итоге
     - Как кастомизировать после генерации

3. **FAQ** (`/docs/faq`)
   - "Нужно ли знать программирование?" — Нет
   - "Сколько стоит?" — Ссылка на pricing
   - "Как работает AI генерация?" — Краткое объяснение
   - "Можно ли редактировать код?" — Да, скачай ZIP
   - "Как задеплоить?" — One-click через Railway
   - "Безопасно ли это?" — Да, описание мер
   - "Как получить бесплатные кредиты?" — Daily bonus
   - "Могу ли я использовать свой сервер?" — Скачай код и деплой куда хочешь

4. **API Reference** (`/docs/api`) — optional для MVP
   - Swagger/OpenAPI ссылка: api.viably.dev/docs

**Acceptance Criteria:**
- [ ] Quick Start с скриншотами
- [ ] 6 template guides
- [ ] FAQ покрывает основные вопросы
- [ ] Ссылки из app на документацию

### Task 2: Blog Posts (3 штуки для запуска)
**Описание:** SEO-контент + launch content

**Post 1: "Как создать Telegram-бота за 60 секунд"**
- Target: "создать telegram бота" keywords
- Content: Step-by-step tutorial с Viably
- CTA: "Попробуй бесплатно"
- ~1000-1500 слов

**Post 2: "5 идей Telegram-ботов для малого бизнеса"**
- Target: предприниматели, SMB
- Content: Shop bot, FAQ bot, Booking bot, Support bot, Notification bot
- Для каждого: проблема, решение, пример конфигурации
- CTA: "Создай бот для своего бизнеса"
- ~1500-2000 слов

**Post 3: "Мы запустили Viably — AI-платформа для создания Telegram-ботов" (launch post)**
- Target: tech community, indie hackers
- Content: Почему создали, что умеет, tech stack, планы
- Tone: personal, founder story
- CTA: "Попробуй бесплатно"
- ~800-1200 слов

**Размещение:** 
- Blog на сайте (`/blog/*`)
- Cross-post: Habr, VC.ru, Dev.to, Medium

**Acceptance Criteria:**
- [ ] 3 поста написаны
- [ ] SEO мета-теги для каждого
- [ ] Blog section на сайте или в Notion
- [ ] Готовы к cross-posting

### Task 3: Email Templates
**Файлы:** Email templates (HTML) или через Resend/Postmark
**Описание:** Транзакционные и маркетинговые письма

**Транзакционные (обязательные):**

1. **Welcome Email** (при регистрации)
   ```
   Subject: Добро пожаловать в Viably! 🚀
   
   Привет, {name}!
   
   Ты зарегистрировался в Viably — теперь ты можешь создавать 
   Telegram-ботов за 60 секунд.
   
   У тебя уже есть 5 кредитов для старта.
   
   Что дальше:
   1. Выбери шаблон → {link}
   2. Заполни параметры
   3. Получи готовый бот!
   
   [Создать первый бот →]
   ```

2. **Generation Complete** (бот сгенерирован)
   ```
   Subject: Твой бот {project_name} готов! ✅
   
   {name}, бот "{project_name}" успешно сгенерирован.
   
   Следующий шаг — задеплоить его:
   [Задеплоить бот →]
   
   Или скачай код: [Скачать ZIP]
   ```

3. **Deploy Success** (бот задеплоен)
   ```
   Subject: 🎉 Бот @{bot_username} запущен!
   
   Твой бот работает и доступен в Telegram:
   [Открыть @{bot_username} →]
   ```

4. **Low Credits Warning** (осталось < 3 кредитов)
   ```
   Subject: У тебя осталось {credits} кредитов
   
   Не забудь пополнить баланс чтобы продолжить создавать ботов.
   [Пополнить кредиты →]
   ```

**Acceptance Criteria:**
- [ ] 4 email template реализованы
- [ ] Отправка через Resend или аналог
- [ ] Тестовая отправка работает
- [ ] Unsubscribe link в маркетинговых

### Task 4: Demo Video Script
**Описание:** Скрипт для 2-минутного demo видео

**Формат:** Screen recording + voiceover (или text overlay)

**Script:**
```
[0:00-0:10] Hook
"Создай Telegram-бота за 60 секунд. Без кода."
Показать: landing page hero

[0:10-0:25] Register
"Регистрация занимает 5 секунд"
Показать: быстрая регистрация → dashboard

[0:25-0:45] Choose Template
"Выбираем шаблон — например, Shop Bot"
Показать: templates gallery → click Shop Bot

[0:45-1:15] Configure
"Заполняем пару полей: название, товары, способ оплаты"
Показать: generation page, config form

[1:15-1:35] Generate
"Нажимаем 'Генерировать' — AI пишет код в реальном времени"
Показать: generation progress, code appearing

[1:35-1:50] Deploy
"Один клик — и бот в Telegram"
Показать: deploy modal → success → confetti

[1:50-2:00] CTA
"Попробуй бесплатно на viably.dev"
Показать: landing page + URL
```

**Acceptance Criteria:**
- [ ] Скрипт написан
- [ ] Screen recording сделан (когда app готов)
- [ ] Video залит на YouTube + встроен на landing
- [ ] Thumbnail создан

### Task 5: Social Media Assets
**Описание:** Готовые посты и визуалы для запуска

**ProductHunt:**
- Tagline: "AI-powered Telegram bot builder — create bots in 60 seconds"
- Description (200 words): проблема → решение → features → CTA
- 5 скриншотов/GIFs: landing, templates, generation, deploy, result
- Maker comment: personal story + что планируем

**Twitter Launch Thread (10 tweets):**
1. Hook: "I built an AI that creates Telegram bots in 60 seconds 🤖"
2. Problem: "Building bots is hard. You need to know Python, APIs, hosting..."
3. Solution: "Viably does it all. Pick a template, describe what you want, done."
4. Demo GIF: generation flow
5. Templates: "6 templates: Shop, FAQ, Support, Booking, Poll, Notifications"
6. Tech: "Powered by Claude AI. One-click deploy to Railway."
7. Pricing: "Start free. 5 credits on signup."
8. Metrics/Social proof: "Already {N} bots created during beta"
9. Roadmap: "Coming next: API services, team collab, more templates"
10. CTA: "Try it free → viably.dev"

**Reddit Posts (r/SideProject, r/NoCode, r/Telegram):**
- Title: "I built an AI-powered Telegram bot builder — create bots in 60 seconds"
- Content: personal story, demo link, asking for feedback
- NOT salesy, genuine community post

**Telegram Channel Post:**
- Объявление запуска на русском
- Demo video
- Ссылка

**Acceptance Criteria:**
- [ ] ProductHunt submission draft готов
- [ ] Twitter thread написан
- [ ] Reddit post написан
- [ ] Screenshots/GIFs сделаны
