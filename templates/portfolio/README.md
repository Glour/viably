# 💼 Portfolio Template

Современное личное портфолио на Next.js с темным дизайном.

## ✨ Возможности

- 🎨 Стильный темный дизайн с градиентами
- 📱 Полностью адаптивный
- ⚡ Быстрая загрузка
- 🚀 SEO-оптимизирован
- 📧 Секция контактов

## 🚀 Быстрый старт

### 1. Установка

```bash
npm install
```

### 2. Запуск

```bash
npm run dev
```

Откройте http://localhost:3002

### 3. Персонализация

Отредактируйте `app/page.tsx`:

```typescript
// Ваше имя
<h1>Your Name</h1>

// Ваши проекты
const projects = [
  {
    title: 'Your Project',
    description: 'Description',
    tech: ['Tech', 'Stack'],
    link: 'https://github.com/...'
  }
]

// Ваши навыки
const skills = [
  { category: 'Frontend', items: ['React', 'Next.js'] }
]
```

## 📝 Секции

1. **Hero** - Имя, фото, CTA
2. **About** - О себе
3. **Skills** - Технические навыки
4. **Projects** - Портфолио проектов
5. **Contact** - Контакты и соцсети
6. **Footer** - Копирайт

## 🎨 Кастомизация

### Изменить цвета

В `app/page.tsx` измените Tailwind классы:

```tsx
// Градиент фона
className="bg-gradient-to-br from-YOUR-COLOR to-YOUR-COLOR"

// Кнопки
className="bg-blue-600" → "bg-YOUR-COLOR"
```

### Добавить аватар

Замените `JD` на изображение:

```tsx
<img 
  src="/avatar.jpg" 
  alt="Your Name"
  className="w-32 h-32 rounded-full mx-auto"
/>
```

### Добавить проект

В массив `projects`:

```typescript
{
  title: 'New Project',
  description: 'What it does',
  tech: ['Next.js', 'TypeScript'],
  link: 'https://github.com/...'
}
```

## 🚀 Deploy

### Vercel (рекомендуется)

```bash
vercel
```

### Другие платформы

```bash
npm run build
npm start
```

## 📦 Расширения

### Добавить блог

Интегрируйте Blog Template в `/blog` route.

### Темная/светлая тема

Добавьте переключатель:

```tsx
const [dark, setDark] = useState(true)
```

### Анимации

Установите `framer-motion`:

```bash
npm install framer-motion
```

```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  Content
</motion.div>
```

### Форма контакта

Интегрируйте FormSpree или EmailJS:

```tsx
<form action="https://formspree.io/f/YOUR_ID" method="POST">
  <input type="email" name="email" />
  <button type="submit">Send</button>
</form>
```

## 🛠 Технологии

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## 📄 Лицензия

MIT - свободное использование.
