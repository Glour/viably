# Launch Module: Beta Testing & Feedback Loop

## Описание
Invite-only beta с 10-20 тестерами, сбор feedback, исправление багов, итерация на основе реального использования.

## Зависимости
- 13-infrastructure (production deployment)
- 14-docs-content (документация для тестеров)

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 5-7 дней (включая время тестеров)

---

## Задачи

### Task 1: Invite System
**Файл:** Backend: `app/auth/invite.py`, Frontend: invite landing
**Описание:** Invite-only регистрация для beta

**Вариант A (простой, рекомендую для MVP):**
- Feature flag: `REGISTRATION_MODE=invite_only`
- Список разрешённых email в ENV или DB table
- Регистрация с неразрешённым email → "Сейчас доступ по приглашению. Оставь email и мы свяжемся."
- Waitlist email collection form

**Вариант B (invite codes):**
- Генерация invite codes: `BETA-XXXX-XXXX`
- Поле "Invite Code" на регистрации
- Код одноразовый
- Админ может создавать коды

**Acceptance Criteria:**
- [ ] Регистрация ограничена (invite only)
- [ ] Разрешённые пользователи могут зарегистрироваться
- [ ] Waitlist для остальных
- [ ] Легко переключить на open registration

### Task 2: Beta Onboarding
**Описание:** Специальный onboarding для бета-тестеров

**Welcome Flow (first login):**
1. Welcome modal: "Спасибо что ты в beta! 🎉"
2. "У тебя 20 бесплатных кредитов (вместо 5)"
3. "Пожалуйста, попробуй создать и задеплоить бот"
4. "Нашёл баг или есть идея? Напиши в наш Telegram чат"
5. Link: Telegram feedback group
6. [Начать! →] → dashboard

**Beta Perks:**
- 20 стартовых кредитов (вместо 5)
- 10 daily bonus (вместо 3-5)
- "Beta Tester" badge на профиле
- Priority support в Telegram чате

**Acceptance Criteria:**
- [ ] Welcome modal для beta users
- [ ] Extra credits начислены
- [ ] Badge отображается
- [ ] Link на feedback channel

### Task 3: Feedback Collection
**Описание:** Механизмы сбора feedback

**In-App Feedback (быстрый):**
- Floating feedback button (bottom-right): "💬 Feedback"
- Click → small modal:
  - Type: Bug / Feature Request / Other
  - Text input
  - Optional: screenshot (paste from clipboard)
  - [Отправить]
- Данные → Notion database или Google Form или простой API → email

**Telegram Feedback Group:**
- Создать закрытую группу "Viably Beta Testers"
- Пригласить всех тестеров
- Pinned message: "Пишите баги, идеи, вопросы. Мы всё читаем!"
- Ты лично отвечаешь на всё

**Post-Session Survey (через 3-5 дней):**
- Email или Telegram сообщение:
  1. "Удалось ли создать бота?" (Да/Нет)
  2. "Что было непонятно?" (free text)
  3. "Что бы ты улучшил?" (free text)
  4. "Готов ли ты платить за это?" (Да / Нет / Может быть)
  5. "Сколько готов платить в месяц?" (0 / 500₽ / 1000₽ / 2000₽+)
  6. NPS: "Порекомендуешь ли друзьям? (1-10)"

**Acceptance Criteria:**
- [ ] In-app feedback кнопка работает
- [ ] Telegram группа создана
- [ ] Survey подготовлен
- [ ] Feedback попадает в одно место (Notion/sheet)

### Task 4: Bug Tracking & Prioritization
**Описание:** Процесс работы с багами из beta

**Triage Process:**
1. Feedback приходит (app, Telegram, survey)
2. Записать в Notion/Linear: title, описание, severity, reproduction steps
3. Приоритизация:
   - **P0 Critical:** Ломает core flow (auth, generation, deploy) → fix в тот же день
   - **P1 High:** Ломает secondary flow → fix в 1-2 дня
   - **P2 Medium:** UI/UX issue → fix до public launch
   - **P3 Low:** Nice to have → backlog

**Common Beta Issues (anticipate):**
- Generation timeout → увеличить timeout, better error message
- Deploy fail → better error handling, retry button
- Mobile UI broken → responsive fixes
- Confusion with credits → better onboarding/tooltips
- "What does this button do?" → better copy/labels

**Acceptance Criteria:**
- [ ] Bug tracking setup (Notion/Linear/GitHub Issues)
- [ ] Severity levels defined
- [ ] Process documented

### Task 5: Iteration Sprint
**Описание:** Быстрый sprint исправлений по результатам beta

**День 1-2: Critical Fixes**
- P0 bugs исправлены
- Core flow работает у всех тестеров
- Performance issues resolved

**День 3-4: UX Improvements**
- P1 bugs исправлены
- Confusion points resolved (better copy, tooltips)
- Mobile fixes
- Loading states улучшены

**День 5: Final Polish**
- P2 bugs по возможности
- Empty states, error messages
- Final responsive check
- Production build test

**Health Checks после iteration:**
```bash
/health-bugs
/health-security
/health-cleanup
npm run build     # frontend builds
pytest            # backend tests pass
```

**Acceptance Criteria:**
- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed
- [ ] Top P2 bugs fixed
- [ ] Beta testers confirm improvement
- [ ] NPS ≥ 7 average
