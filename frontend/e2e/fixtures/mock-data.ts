// Auth responses
export const MOCK_USER = {
  id: "user-1",
  email: "test@viably.dev",
  full_name: "Test User",
  avatar_url: null,
  plan: "free",
  credits: 100,
  referral_code: "REF123",
  is_verified: true,
  created_at: "2026-01-01T00:00:00Z",
  last_login_at: "2026-02-08T10:00:00Z",
}

export const MOCK_AUTH_RESPONSE = {
  data: {
    user: MOCK_USER,
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
  },
}

export const MOCK_ME_RESPONSE = { data: MOCK_USER }

// Credits responses
export const MOCK_CREDITS_BALANCE = {
  data: {
    credits: 100,
    plan: "free",
    daily_bonus: {
      amount: 10,
      claimed_today: false,
      next_available_at: null,
      streak_days: 0,
    },
  },
}

export const MOCK_DAILY_BONUS_CLAIMED = {
  data: {
    claimed: true,
    amount: 10,
    new_balance: 110,
    next_available_at: "2026-02-09T00:00:00Z",
  },
}

export const MOCK_CREDITS_AFTER_GENERATION = {
  data: {
    credits: 90,
    plan: "free",
    daily_bonus: {
      amount: 10,
      claimed_today: false,
      next_available_at: null,
      streak_days: 0,
    },
  },
}

// Templates
export const MOCK_TEMPLATE = {
  id: "tpl-1",
  name: "FAQ Bot",
  slug: "faq-bot",
  description: "Бот для ответов на часто задаваемые вопросы",
  category: "support",
  credit_cost: 10,
  preview_image_url: null,
  features: ["Автоответы", "База знаний", "Аналитика"],
  tags: ["faq", "support"],
  usage_count: 150,
  created_at: "2026-01-01T00:00:00Z",
}

export const MOCK_TEMPLATE_DETAIL = {
  ...MOCK_TEMPLATE,
  config_schema: {
    type: "object",
    properties: {
      bot_name: { type: "string", title: "Название бота" },
      language: { type: "string", enum: ["ru", "en"], title: "Язык", default: "ru" },
    },
    required: ["bot_name"],
  },
  example_config: { bot_name: "My FAQ Bot", language: "ru" },
}

export const MOCK_TEMPLATES_LIST = { data: { templates: [MOCK_TEMPLATE] } }
export const MOCK_TEMPLATE_DETAIL_RESPONSE = { data: MOCK_TEMPLATE_DETAIL }

// Projects
export const MOCK_PROJECT_DRAFT = {
  id: "proj-1",
  user_id: "user-1",
  name: "My FAQ Bot",
  description: "Test project",
  template_id: "tpl-1",
  config: { bot_name: "My FAQ Bot", language: "ru" },
  status: "draft",
  is_public: false,
  created_at: "2026-02-08T10:00:00Z",
  updated_at: null,
  generated_code: null,
  generation_logs: null,
  ai_model_used: null,
  error_message: null,
  deployed_url: null,
  deploy_platform: null,
  generated_at: null,
  deployed_at: null,
}

export const MOCK_PROJECT_GENERATED = {
  ...MOCK_PROJECT_DRAFT,
  status: "ready",
  generated_code: {
    files: {
      "bot.py": "import telebot\n\nbot = telebot.TeleBot('TOKEN')\n\n@bot.message_handler(commands=['start'])\ndef start(message):\n    bot.reply_to(message, 'Hello!')\n\nbot.polling()",
      "requirements.txt": "pyTelegramBotAPI==4.14.0",
    },
    entry_point: "bot.py",
    runtime: "python3.11",
  },
  ai_model_used: "claude-sonnet-4-6",
  generated_at: "2026-02-08T10:05:00Z",
}

export const MOCK_PROJECT_DEPLOYED = {
  ...MOCK_PROJECT_GENERATED,
  status: "deployed",
  deployed_url: "https://my-faq-bot.viably.dev",
  deploy_platform: "docker",
  deployed_at: "2026-02-08T10:10:00Z",
}

export const MOCK_PROJECTS_LIST = {
  items: [MOCK_PROJECT_DRAFT],
  total: 1,
  page: 1,
  per_page: 20,
  pages: 1,
}

// Deploy
export const MOCK_DEPLOY_RESPONSE = {
  deploy_id: "deploy-1",
  status: "deploying",
}

export const MOCK_DEPLOYMENT_INFO = {
  deploy_id: "deploy-1",
  status: "deployed",
  url: "https://my-faq-bot.viably.dev",
  deployed_at: "2026-02-08T10:10:00Z",
}

// Generation API
export const MOCK_GENERATE_RESPONSE = {
  project_id: "proj-1",
  status: "generating",
}

export const MOCK_CODE_RESPONSE = {
  files: [
    { path: "bot.py", content: "import telebot\n...", language: "python" },
    { path: "requirements.txt", content: "pyTelegramBotAPI==4.14.0", language: "text" },
  ],
}

// WebSocket messages (generation flow)
export const WS_GENERATION_MESSAGES = [
  { type: "generation_progress", step: "analyze", progress: 0.1, message: "Анализ шаблона..." },
  { type: "generation_progress", step: "architecture", progress: 0.3, message: "Проектирование архитектуры..." },
  { type: "generation_progress", step: "code", progress: 0.5, message: "Генерация кода..." },
  { type: "generation_progress", step: "review", progress: 0.7, message: "Проверка кода..." },
  { type: "generation_progress", step: "testing", progress: 0.85, message: "Тестирование..." },
  { type: "generation_progress", step: "finalize", progress: 0.95, message: "Финализация..." },
  { type: "generation_complete", project_id: "proj-1", files_count: 2 },
]

// WebSocket messages (deploy flow)
export const WS_DEPLOY_MESSAGES = [
  { type: "deploy_progress", step: "github", progress: 0.15, message: "Подготовка репозитория..." },
  { type: "deploy_progress", step: "push", progress: 0.3, message: "Отправка кода..." },
  { type: "deploy_progress", step: "build", progress: 0.6, message: "Сборка проекта..." },
  { type: "deploy_progress", step: "start", progress: 0.85, message: "Запуск бота..." },
  { type: "deploy_progress", step: "health", progress: 0.95, message: "Проверка здоровья..." },
  { type: "deploy_complete", project_id: "proj-1", url: "https://my-faq-bot.viably.dev" },
]

// Constants
export const TEST_EMAIL = "test@viably.dev"
export const TEST_PASSWORD = "TestPass123!"
export const TEST_NAME = "Test User"
export const ACCESS_TOKEN_KEY = "viably_access_token"
export const REFRESH_TOKEN_KEY = "viably_refresh_token"
export const API_BASE = "**/api/"
