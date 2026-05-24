# 📝 Blog Template

Современный блог на Next.js с поддержкой MDX. Пишите посты в Markdown!

## ✨ Возможности

- 📝 MDX поддержка (Markdown + React)
- 🏷 Теги и категории
- 📅 Сортировка по дате
- 🎨 Tailwind CSS стили
- 📱 Адаптивный дизайн
- ⚡ Статическая генерация (SSG)

## 🚀 Быстрый старт

### 1. Установка

```bash
npm install
```

### 2. Запуск dev сервера

```bash
npm run dev
```

Откройте http://localhost:3001

### 3. Создание поста

Создайте файл `posts/my-post.mdx`:

```mdx
---
title: 'Мой пост'
date: '2024-01-20'
excerpt: 'Краткое описание'
tags: ['тег1', 'тег2']
---

# Заголовок

Ваш контент здесь...
```

## 📁 Структура

```
app/
├── page.tsx              # Список постов
├── posts/[slug]/page.tsx # Страница поста
├── layout.tsx
└── globals.css

posts/
├── hello-world.mdx       # Пример поста 1
└── getting-started.mdx   # Пример поста 2

lib/
└── posts.ts              # Логика загрузки постов
```

## ✍️ Написание постов

### Frontmatter

```yaml
---
title: 'Заголовок поста'
date: '2024-01-20'
excerpt: 'Краткое описание для превью'
tags: ['nextjs', 'tutorial']
---
```

### MDX фичи

- **Markdown**: заголовки, списки, ссылки, код
- **React компоненты**: можно импортировать JSX
- **Syntax highlighting**: подсветка кода
- **Типографика**: красивое форматирование

### Пример с кодом

```mdx
# Заголовок

Обычный текст.

\`\`\`javascript
const hello = 'world'
console.log(hello)
\`\`\`

> Цитата

- Список
- Элементов
```

## 🎨 Кастомизация

### Стили

Отредактируйте `app/globals.css` для изменения типографики.

### Компоненты

Создайте `components/` и импортируйте в MDX:

```mdx
import { MyComponent } from '@/components/MyComponent'

<MyComponent />
```

### Цвета

В `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#your-color'
    }
  }
}
```

## 🚀 Deploy

### Vercel

```bash
vercel
```

### Статический экспорт

```bash
npm run build
# Файлы в .next/
```

## 📦 Расширения

### Добавить автора

В frontmatter:

```yaml
author: 'Ваше имя'
```

В `lib/posts.ts` добавьте поле.

### Категории

Добавьте фильтрацию по тегам:

```typescript
export async function getPostsByTag(tag: string) {
  const posts = await getAllPosts()
  return posts.filter(p => p.tags?.includes(tag))
}
```

### RSS Feed

Установите `feed` пакет и генерируйте RSS в build time.

## 🛠 Технологии

- Next.js 15
- React 19
- MDX 3
- Tailwind CSS
- TypeScript

## 📄 Лицензия

MIT - свободное использование.
