# Frontend Module: Templates Gallery

## Описание
Галерея шаблонов ботов с поиском, фильтрами, детальными карточками. Включает Template Detail page.

## Зависимости
- 01-design-system
- 03-dashboard (shared project card component)

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 1-2 дня

---

## Задачи

### Task 1: Templates Gallery Page
**Файл:** `app/(main)/templates/page.tsx`
**Описание:** Основная страница галереи

**Layout:**
- Heading: "Шаблоны ботов" (H1)
- Subtitle: "Выбери шаблон и создай бота за минуту"
- Search bar
- Filter tabs
- Grid of template cards

**Search Bar:**
- Full width, icon left (🔍), placeholder "Поиск шаблонов..."
- Debounced search (300ms)
- Filter results in real-time (client-side для MVP)

**Filter Tabs (pill style):**
- [Все] [Telegram] [Популярные] [Дешёвые < 5 cr.]
- Active tab: gradient bg + white text
- Inactive: surface bg + text secondary
- Smooth transition between states

**Acceptance Criteria:**
- [ ] Search filters cards in real-time
- [ ] Filter tabs work
- [ ] Active tab styling
- [ ] Responsive grid

### Task 2: Template Card Component
**Файл:** `components/templates/template-card.tsx`
**Описание:** Карточка шаблона для галереи

**Элементы:**
- Large emoji icon (top, 48px)
- Template name (Space Grotesk, 20px, 600)
- Gradient line separator (height: 1px, primary gradient, full width)
- Description (14px, text-secondary, 2-3 lines, line-clamp)
- Feature list (checkmarks ✓ + feature name, max 4)
- Credits badge: "💎 {cost} credits" (pill badge, bottom)
- CTA button: "Использовать →" (secondary, full width, bottom)

**Hover State:**
- translateY(-4px)
- Shadow increases
- Gradient line: opacity 0→1 (appears)
- Border: transitions to primary-subtle
- transition: 400ms

**Grid:** 
- Desktop: 3 columns, gap 24px
- Tablet: 2 columns
- Mobile: 1 column

**Acceptance Criteria:**
- [ ] All visual elements present
- [ ] Hover animation smooth
- [ ] Gradient line reveal on hover
- [ ] Responsive grid
- [ ] Click navigates to template detail

### Task 3: Template Data (Mock)
**Файл:** `lib/data/templates.ts`
**Описание:** Mock data для 6 шаблонов

```typescript
interface Template {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  category: "telegram_bot";
  creditCost: number;
  features: string[];
  tags: string[];
  configFields: ConfigField[];
  isPopular: boolean;
}

interface ConfigField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect" | "number";
  required: boolean;
  placeholder?: string;
  options?: string[];
}
```

**6 шаблонов:**
1. FAQ Bot (3 cr.) — emoji: ❓, features: Q&A база, Inline кнопки, Поиск
2. Shop Bot (5 cr.) — emoji: 🛒, features: Каталог, Корзина, Оплата, Уведомления, isPopular: true
3. Notification Bot (3 cr.) — emoji: 🔔, features: Рассылки, Подписка, Расписание
4. Poll Bot (4 cr.) — emoji: 📊, features: Опросы, Результаты, Аналитика, Экспорт
5. Support Bot (6 cr.) — emoji: 🎫, features: Тикеты, Админ панель, Статусы, Авто-ответы
6. Booking Bot (8 cr.) — emoji: 📅, features: Календарь, Слоты, Бронирование, Напоминания

**Acceptance Criteria:**
- [ ] All 6 templates defined
- [ ] Config fields for each template
- [ ] TypeScript types exported

### Task 4: Template Detail Page
**Файл:** `app/(main)/templates/[slug]/page.tsx`
**Описание:** Детальная страница шаблона (перед созданием проекта)

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ← Назад к шаблонам                          │
│                                               │
│  ┌─────────────┬────────────────────────┐    │
│  │  Left (40%) │  Right (60%)           │    │
│  │             │                         │    │
│  │  🛒 (64px)  │  Что умеет этот бот:  │    │
│  │  Shop Bot   │                         │    │
│  │             │  ✓ Каталог товаров     │    │
│  │  ────       │  ✓ Корзина             │    │
│  │             │  ✓ Оплата ЮKassa       │    │
│  │  Описание   │  ✓ Уведомления        │    │
│  │  текст...   │                         │    │
│  │             │  Что нужно настроить:   │    │
│  │  💎 5 cr.   │  - Название магазина   │    │
│  │             │  - Список товаров      │    │
│  │  [Создать   │  - Платёжная система   │    │
│  │   проект →] │  - Способы доставки    │    │
│  │             │                         │    │
│  └─────────────┴────────────────────────┘    │
│                                               │
│  Примеры использования                       │
│  [Screenshots or description of use cases]   │
│                                               │
└──────────────────────────────────────────────┘
```

**CTA "Создать проект →":**
- Gradient button
- Shows credit cost
- If not enough credits: disabled + "Недостаточно кредитов" tooltip + "Пополнить →" link
- Click → creates project → redirects to `/projects/{newId}/generate`

**Acceptance Criteria:**
- [ ] Template info displayed
- [ ] Feature list
- [ ] Config preview (what user will need to fill)
- [ ] Credit check before create
- [ ] Back navigation
- [ ] Responsive (stack on mobile)
