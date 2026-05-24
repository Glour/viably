"""Template-specific prompt for online store website generation."""

ONLINE_STORE_PROMPT = """\
## Online Store — Template-Specific Instructions

### Multi-file React Architecture
React + Vite + shadcn/ui проект. Генерируй МНОЖЕСТВО файлов.

### Уникальность
- **Переопредели CSS custom properties** в index.css — палитра под тип магазина
- Стиль ВАРЬИРУЙ: модный/luxury, массмаркет, tech-store, eco-friendly
- Карточки товаров — каждый раз в другом стиле

### Контент
- 8-12 реалистичных товаров с русскими названиями и описаниями
- 3-4 категории, цены реалистичные для российского рынка
- Плейсхолдеры изображений: цветные gradient-дивы с иконками lucide-react

### Функционал
1. **Header** — навигация, поиск, иконка корзины с Badge
2. **Фильтр категорий** — Tabs или Button-группа
3. **Каталог товаров** — responsive grid карточек
4. **Карточка товара** — Card с плейсхолдером, название, цена, кнопка "В корзину"
5. **Корзина** — Sheet/Dialog: список, количество, итого, кнопка "Оформить заказ"
6. **Пустые состояния** — когда нет товаров или корзина пуста

### Структура файлов
- `src/pages/Home.tsx`
- `src/components/store/Header.tsx`, `ProductCard.tsx`, `ProductGrid.tsx`, `CartSheet.tsx`, `CategoryFilter.tsx`
- `src/hooks/useCart.ts` — состояние корзины
- `src/types/index.ts` — Product, CartItem interfaces
- `src/data/products.ts` — массив товаров

### Запрещённые CSS-приёмы
- НЕ использовать clip-path, skewY()/skewX() на секциях
"""
