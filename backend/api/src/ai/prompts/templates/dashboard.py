"""Template-specific prompt for SaaS dashboard webapp generation."""

DASHBOARD_PROMPT = """\
## SaaS Dashboard — Template-Specific Instructions

### Тип проекта
React webapp с панелью управления (dashboard). SPA с sidebar-навигацией, аналитикой, таблицами.

### Уникальность
- **Переопредели CSS custom properties** в index.css — палитра должна соответствовать сфере дашборда
- CRM → синий корпоративный; Аналитика → тёмный с яркими акцентами; Управление проектами → нейтральный
- Layout sidebar-а ВАРЬИРУЙ: тёмный/светлый, с иконками/текстом, collapsible

### Страницы
1. **Dashboard** (`/`) — KPI-карточки и графики
2. **Список сущностей** (`/items`) — таблица с поиском, фильтрами, пагинацией
3. **Детальная страница** (`/items/:id`) — просмотр и редактирование
4. **Настройки** (`/settings`) — профиль и параметры

### Layout
- **Sidebar** (слева): логотип, навигация (lucide-react иконки), профиль
- Sidebar collapsible на мобильном
- **Header**: заголовок страницы, поиск, аватар с DropdownMenu
- **Main content**: с padding и scroll

### Dashboard страница
- Stat-карточки (количество варьируй: 3-6)
- Графики: простые SVG charts (без внешних библиотек)
- Таблица последних событий с Badge для статусов

### Таблица данных
- HTML table с Tailwind стилями, поиск, фильтры, пагинация
- Badge для статусов (цветные)

### Данные
- Реалистичные mock-данные (русские имена, даты, суммы)
- Минимум 5-7 элементов в списках

### Компоненты
- `src/components/layout/Sidebar.tsx`, `Header.tsx`, `Layout.tsx`
- `src/components/dashboard/StatCard.tsx`
- `src/pages/Dashboard.tsx`, `Items.tsx`, `Settings.tsx`

### Запрещённые CSS-приёмы
- НЕ используй clip-path, skewY()/skewX() на секциях
"""
