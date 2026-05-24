# 🚀 Landing Page Template

Современный одностраничный сайт на Next.js с Tailwind CSS. Production-ready!

## ✨ Возможности

- ⚡ Next.js 15 с App Router
- 🎨 Tailwind CSS для стилей
- 📱 Полностью адаптивный дизайн
- 🎯 SEO-оптимизирован
- 🚀 Готов к деплою на Vercel

## 🏃 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
# или
yarn install
```

### 2. Запуск в dev режиме

```bash
npm run dev
```

Откройте http://localhost:3000

### 3. Production build

```bash
npm run build
npm start
```

## 📁 Структура

```
app/
├── page.tsx        # Главная страница
├── layout.tsx      # Layout wrapper
└── globals.css     # Глобальные стили
```

## 🎨 Кастомизация

### Изменить цвета

Отредактируйте `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    }
  }
}
```

### Изменить контент

Отредактируйте `app/page.tsx` - все секции там.

### Добавить секцию

```tsx
<section className="container mx-auto px-4 py-20">
  <h2 className="text-4xl font-bold text-center mb-12">
    New Section
  </h2>
  {/* ваш контент */}
</section>
```

## 🚀 Deploy

### Vercel (рекомендуется)

```bash
npm i -g vercel
vercel
```

### Docker

```bash
docker build -t landing-page .
docker run -p 3000:3000 landing-page
```

### Статический экспорт

В `next.config.ts` добавьте:

```typescript
output: 'export',
```

Затем:

```bash
npm run build
# Файлы в out/
```

## 📝 Секции

- **Hero** - Главный экран с CTA
- **Features** - 3 фичи продукта
- **Pricing** - Тарифные планы
- **CTA** - Призыв к действию
- **Footer** - Подвал

## 🛠 Технологии

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 3

## 📄 Лицензия

MIT - свободное использование.
