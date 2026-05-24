export type LandingNavItem = {
  href: string;
  label: string;
};

export type LandingFeature = {
  icon: "layout" | "wand" | "layers";
  title: string;
  text: string;
  detail: string;
};

export type LandingMetric = {
  value: string;
  label: string;
};

export const siteContent = {
  brand: {
    name: "Northstar Studio",
    nav: [
      { href: "#features", label: "Возможности" },
      { href: "#metrics", label: "Результаты" },
      { href: "#cta", label: "Запуск" },
    ] satisfies LandingNavItem[],
    primaryAction: "Запросить демо",
  },
  hero: {
    badge: "Website boilerplate",
    title: "Лендинг, который уже собран как нормальный продуктовый сайт",
    description:
      "База включает hero, секции преимуществ, метрики, финальный CTA и навигацию по якорям. AI должен адаптировать этот каркас под запрос, а не генерировать всё с нуля.",
    primaryAction: "Запустить проект",
    secondaryAction: "Посмотреть кейсы",
    panelTitle: "Что уже лежит в бойлерплейте",
    bullets: [
      "Структура секций уже готова к адаптации под нишу",
      "Шрифты, сетка и CTA не нужно собирать с нуля",
      "Лендинг легко расширить новыми блоками",
    ],
  },
  features: {
    eyebrow: "Преимущества",
    title: "Стартовая архитектура для маркетинговых сайтов",
    items: [
      {
        icon: "layout",
        title: "Секции уже разложены",
        text: "Есть готовая композиция лендинга с hero, trust-блоками и финальным CTA.",
        detail: "Используйте блок как основу и адаптируйте копирайтинг, визуал и порядок секций под конкретный продукт.",
      },
      {
        icon: "wand",
        title: "AI меняет, а не изобретает",
        text: "Модель получает рабочий каркас и должна адаптировать его под нишу пользователя.",
        detail: "Меняйте контент существующих блоков, а не пересобирайте весь лендинг, если это не требуется запросом.",
      },
      {
        icon: "layers",
        title: "Проще масштабировать",
        text: "Можно добавлять pricing, FAQ, gallery и другие блоки без слома структуры.",
        detail: "Структура уже готова для расширения, поэтому новые секции можно аккуратно встраивать поверх базы.",
      },
    ] satisfies LandingFeature[],
  },
  metrics: [
    { value: "12 ч", label: "до первого собранного прототипа" },
    { value: "6+", label: "готовых landing-секций в базе" },
    { value: "1", label: "единый визуальный каркас для доработки" },
  ] satisfies LandingMetric[],
  cta: {
    eyebrow: "Готово к адаптации",
    title: "Используйте этот лендинг как базу, а не как одноразовый черновик",
    description:
      "Меняйте оффер, секции, палитру и контент под нишу. Базовая структура уже готова для дальнейшей генерации.",
    primaryAction: "Собрать страницу",
    secondaryAction: "Обсудить задачу",
  },
  footer: {
    note: "Northstar Studio, website boilerplate for Viably.",
    links: [
      { href: "#hero", label: "Наверх" },
      { href: "#features", label: "Секции" },
      { href: "#cta", label: "CTA" },
    ] satisfies LandingNavItem[],
  },
} as const;
