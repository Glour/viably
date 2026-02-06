import type { Project, ProjectFile, LogEntry, EnvVariable } from "@/types"

// --- Shared mock files (Python Telegram bot via aiogram) ---

const MOCK_FILES: ProjectFile[] = [
  {
    path: "main.py",
    name: "main.py",
    type: "file",
    content: `import logging\nfrom aiogram import Bot, Dispatcher\n\nbot = Bot(token=...)\ndp = Dispatcher()\n\nif __name__ == "__main__":\n    dp.run_polling(bot)`,
  },
  {
    path: "config.py",
    name: "config.py",
    type: "file",
    content: `import os\n\nBOT_TOKEN = os.getenv("BOT_TOKEN")\nDATABASE_URL = os.getenv("DATABASE_URL")`,
  },
  {
    path: "handlers",
    name: "handlers",
    type: "folder",
    children: [
      {
        path: "handlers/start.py",
        name: "start.py",
        type: "file",
        content: `from aiogram import Router\n\nrouter = Router()\n\n@router.message(Command("start"))\nasync def cmd_start(message):\n    await message.answer("\u041f\u0440\u0438\u0432\u0435\u0442!")`,
      },
      {
        path: "handlers/help.py",
        name: "help.py",
        type: "file",
        content: `from aiogram import Router\n\nrouter = Router()\n\n@router.message(Command("help"))\nasync def cmd_help(message):\n    await message.answer("\u0421\u043f\u0440\u0430\u0432\u043a\u0430 \u0431\u043e\u0442\u0430")`,
      },
    ],
  },
  {
    path: "models.py",
    name: "models.py",
    type: "file",
    content: `from sqlalchemy import Column, Integer, String\nfrom database import Base\n\nclass User(Base):\n    __tablename__ = "users"\n    id = Column(Integer, primary_key=True)\n    telegram_id = Column(Integer, unique=True)`,
  },
]

// --- Shared mock logs ---

const MOCK_LOGS: LogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-02-06T10:00:00Z",
    level: "info",
    message: "Bot started successfully",
  },
  {
    id: "log-2",
    timestamp: "2026-02-06T10:00:01Z",
    level: "info",
    message: "Polling started",
  },
  {
    id: "log-3",
    timestamp: "2026-02-06T10:00:05Z",
    level: "info",
    message: "Connected to PostgreSQL database",
  },
  {
    id: "log-4",
    timestamp: "2026-02-06T10:01:12Z",
    level: "info",
    message: "Received /start from user 482917364",
  },
  {
    id: "log-5",
    timestamp: "2026-02-06T10:01:13Z",
    level: "info",
    message: "New user registered: telegram_id=482917364",
  },
  {
    id: "log-6",
    timestamp: "2026-02-06T10:03:45Z",
    level: "warning",
    message: "Rate limit approaching for Telegram API (28/30 req/s)",
  },
  {
    id: "log-7",
    timestamp: "2026-02-06T10:05:22Z",
    level: "info",
    message: "Received /help from user 482917364",
  },
  {
    id: "log-8",
    timestamp: "2026-02-06T10:08:30Z",
    level: "error",
    message: "Failed to send message: chat not found (chat_id=999999)",
  },
  {
    id: "log-9",
    timestamp: "2026-02-06T10:10:00Z",
    level: "info",
    message: "Scheduled task executed: daily_cleanup",
  },
  {
    id: "log-10",
    timestamp: "2026-02-06T10:12:15Z",
    level: "info",
    message: "Received callback_query from user 173829461",
  },
  {
    id: "log-11",
    timestamp: "2026-02-06T10:15:33Z",
    level: "warning",
    message: "Database connection pool running low (18/20 used)",
  },
  {
    id: "log-12",
    timestamp: "2026-02-06T10:18:44Z",
    level: "info",
    message: "Payment webhook received: order_id=ORD-0042",
  },
  {
    id: "log-13",
    timestamp: "2026-02-06T10:20:01Z",
    level: "error",
    message: "Webhook signature verification failed for request from 91.210.44.5",
  },
  {
    id: "log-14",
    timestamp: "2026-02-06T10:22:10Z",
    level: "info",
    message: "User 173829461 updated profile settings",
  },
  {
    id: "log-15",
    timestamp: "2026-02-06T10:25:00Z",
    level: "info",
    message: "Health check passed: all services operational",
  },
  {
    id: "log-16",
    timestamp: "2026-02-06T10:28:37Z",
    level: "warning",
    message: "Slow query detected: SELECT * FROM orders (1.8s)",
  },
  {
    id: "log-17",
    timestamp: "2026-02-06T10:30:00Z",
    level: "info",
    message: "Cache invalidated for product catalog",
  },
  {
    id: "log-18",
    timestamp: "2026-02-06T10:32:45Z",
    level: "info",
    message: "Received /start from user 294817352",
  },
]

// --- Shared mock env vars ---

const MOCK_ENV_VARS: EnvVariable[] = [
  {
    id: "env-1",
    key: "BOT_TOKEN",
    value: "7234567890:AAFx3kR9vZQm8bPqN5tYwE1dL6cHjUoKsMf",
    isRevealed: false,
  },
  {
    id: "env-2",
    key: "DATABASE_URL",
    value: "postgresql://user:pass@db.railway.internal:5432/botdb",
    isRevealed: false,
  },
  {
    id: "env-3",
    key: "ADMIN_ID",
    value: "123456789",
    isRevealed: false,
  },
]

// --- Projects ---

export const PROJECTS: Project[] = [
  // 1. Shop Bot - deployed
  {
    id: "b3a1c2d4-e5f6-7890-abcd-ef1234567890",
    name: "Shop Bot",
    emoji: "\uD83D\uDED2",
    description:
      "\u041f\u043e\u043b\u043d\u043e\u0446\u0435\u043d\u043d\u044b\u0439 \u0431\u043e\u0442-\u043c\u0430\u0433\u0430\u0437\u0438\u043d \u0434\u043b\u044f Telegram \u0441 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u043e\u043c \u0442\u043e\u0432\u0430\u0440\u043e\u0432, \u043a\u043e\u0440\u0437\u0438\u043d\u043e\u0439 \u043f\u043e\u043a\u0443\u043f\u043e\u043a, \u043e\u043f\u043b\u0430\u0442\u043e\u0439 \u0447\u0435\u0440\u0435\u0437 \u042eKassa \u0438 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f\u043c\u0438 \u043e \u0437\u0430\u043a\u0430\u0437\u0430\u0445. \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438, \u043f\u043e\u0438\u0441\u043a \u0438 \u0438\u0441\u0442\u043e\u0440\u0438\u044e \u043f\u043e\u043a\u0443\u043f\u043e\u043a.",
    status: "deployed",
    category: "Telegram Bot",
    createdAt: "2026-01-15T09:30:00Z",
    updatedAt: "2026-02-04T14:20:00Z",
    config: {
      "Bot Framework": "aiogram 3.x",
      "\u042f\u0437\u044b\u043a": "Python 3.12",
      "\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445": "PostgreSQL",
      "\u0425\u043e\u0441\u0442\u0438\u043d\u0433": "Railway",
      "\u041f\u043b\u0430\u0442\u0451\u0436\u043d\u0430\u044f \u0441\u0438\u0441\u0442\u0435\u043c\u0430": "\u042eKassa",
    },
    deployment: {
      url: "https://shop-bot-prod.up.railway.app",
      botUsername: "@viably_shop_bot",
      status: "running",
      runningSince: "2026-02-01T08:00:00Z",
      costEstimate: "$2.50/\u043c\u0435\u0441",
    },
    files: MOCK_FILES,
    envVars: [
      ...MOCK_ENV_VARS,
      {
        id: "env-shop-1",
        key: "YUKASSA_SHOP_ID",
        value: "900123",
        isRevealed: false,
      },
      {
        id: "env-shop-2",
        key: "YUKASSA_SECRET",
        value: "live_aBcDeFgHiJkLmNoPqRsT",
        isRevealed: false,
      },
    ],
    logs: MOCK_LOGS,
  },

  // 2. FAQ Bot - deployed
  {
    id: "c4b2d3e5-f6a7-8901-bcde-f12345678901",
    name: "FAQ Bot",
    emoji: "\u2753",
    description:
      "\u0411\u043e\u0442 \u0434\u043b\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0445 \u043e\u0442\u0432\u0435\u0442\u043e\u0432 \u043d\u0430 \u0447\u0430\u0441\u0442\u043e \u0437\u0430\u0434\u0430\u0432\u0430\u0435\u043c\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b \u0441 \u0431\u0430\u0437\u043e\u0439 \u0437\u043d\u0430\u043d\u0438\u0439, inline-\u043a\u043d\u043e\u043f\u043a\u0430\u043c\u0438 \u0438 \u043f\u043e\u0438\u0441\u043a\u043e\u043c. \u041f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u0434\u043e 500 \u043f\u0430\u0440 \u0432\u043e\u043f\u0440\u043e\u0441-\u043e\u0442\u0432\u0435\u0442.",
    status: "deployed",
    category: "Telegram Bot",
    createdAt: "2026-01-20T11:00:00Z",
    updatedAt: "2026-02-03T16:45:00Z",
    config: {
      "Bot Framework": "aiogram 3.x",
      "\u042f\u0437\u044b\u043a": "Python 3.12",
      "\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445": "SQLite",
      "\u0425\u043e\u0441\u0442\u0438\u043d\u0433": "Railway",
    },
    deployment: {
      url: "https://faq-bot-prod.up.railway.app",
      botUsername: "@viably_faq_bot",
      status: "running",
      runningSince: "2026-01-28T12:00:00Z",
      costEstimate: "$1.20/\u043c\u0435\u0441",
    },
    files: MOCK_FILES,
    envVars: MOCK_ENV_VARS,
    logs: MOCK_LOGS.slice(0, 12),
  },

  // 3. Notification Bot - generating
  {
    id: "d5c3e4f6-a7b8-9012-cdef-123456789012",
    name: "Notification Bot",
    emoji: "\uD83D\uDD14",
    description:
      "\u0411\u043e\u0442 \u0434\u043b\u044f \u043c\u0430\u0441\u0441\u043e\u0432\u044b\u0445 \u0440\u0430\u0441\u0441\u044b\u043b\u043e\u043a \u0438 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0439 \u0441 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u043e\u0439 \u043f\u043e\u0434\u043f\u0438\u0441\u043e\u043a, \u0441\u0435\u0433\u043c\u0435\u043d\u0442\u0430\u0446\u0438\u0435\u0439 \u0430\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u0438 \u0438 \u0440\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435\u043c \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0439.",
    status: "generating",
    category: "Telegram Bot",
    createdAt: "2026-02-06T09:15:00Z",
    updatedAt: "2026-02-06T09:15:00Z",
    config: {
      "Bot Framework": "aiogram 3.x",
      "\u042f\u0437\u044b\u043a": "Python 3.12",
      "\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445": "PostgreSQL",
      "\u0425\u043e\u0441\u0442\u0438\u043d\u0433": "Railway",
    },
    deployment: null,
    files: [],
    envVars: [],
    logs: [
      {
        id: "log-gen-1",
        timestamp: "2026-02-06T09:15:00Z",
        level: "info",
        message: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043f\u0440\u043e\u0435\u043a\u0442\u0430 \u0437\u0430\u043f\u0443\u0449\u0435\u043d\u0430...",
      },
      {
        id: "log-gen-2",
        timestamp: "2026-02-06T09:15:02Z",
        level: "info",
        message: "\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u044b \u043f\u0440\u043e\u0435\u043a\u0442\u0430...",
      },
      {
        id: "log-gen-3",
        timestamp: "2026-02-06T09:15:05Z",
        level: "info",
        message: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u043e\u0432 \u043a\u043e\u043c\u0430\u043d\u0434...",
      },
    ],
  },

  // 4. Analytics Bot - generated
  {
    id: "e6d4f5a7-b8c9-0123-defa-234567890123",
    name: "Analytics Bot",
    emoji: "\uD83D\uDCCA",
    description:
      "\u0411\u043e\u0442 \u0434\u043b\u044f \u0441\u0431\u043e\u0440\u0430 \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0438 \u043f\u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f\u043c \u0438 \u0441\u043e\u0431\u044b\u0442\u0438\u044f\u043c. \u041e\u0442\u0447\u0451\u0442\u044b \u043f\u043e \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438, \u0440\u0435\u0442\u0435\u043d\u0446\u0438\u0438, \u043a\u043e\u043d\u0432\u0435\u0440\u0441\u0438\u044f\u043c. \u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u0432 CSV \u0438 \u0433\u0440\u0430\u0444\u0438\u043a\u0438 \u0432 Telegram.",
    status: "generated",
    category: "Telegram Bot",
    createdAt: "2026-02-05T15:30:00Z",
    updatedAt: "2026-02-05T15:42:00Z",
    config: {
      "Bot Framework": "aiogram 3.x",
      "\u042f\u0437\u044b\u043a": "Python 3.12",
      "\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445": "PostgreSQL",
      "\u0425\u043e\u0441\u0442\u0438\u043d\u0433": "Railway",
    },
    deployment: null,
    files: MOCK_FILES,
    envVars: MOCK_ENV_VARS,
    logs: [
      {
        id: "log-ag-1",
        timestamp: "2026-02-05T15:30:00Z",
        level: "info",
        message: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043f\u0440\u043e\u0435\u043a\u0442\u0430 \u0437\u0430\u043f\u0443\u0449\u0435\u043d\u0430...",
      },
      {
        id: "log-ag-2",
        timestamp: "2026-02-05T15:30:03Z",
        level: "info",
        message: "\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u044b \u043f\u0440\u043e\u0435\u043a\u0442\u0430...",
      },
      {
        id: "log-ag-3",
        timestamp: "2026-02-05T15:32:15Z",
        level: "info",
        message: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u043e\u0432 \u043a\u043e\u043c\u0430\u043d\u0434...",
      },
      {
        id: "log-ag-4",
        timestamp: "2026-02-05T15:35:40Z",
        level: "info",
        message: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043c\u043e\u0434\u0435\u043b\u0435\u0439 \u0434\u0430\u043d\u043d\u044b\u0445...",
      },
      {
        id: "log-ag-5",
        timestamp: "2026-02-05T15:38:20Z",
        level: "info",
        message: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430 \u043a\u043e\u043d\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438...",
      },
      {
        id: "log-ag-6",
        timestamp: "2026-02-05T15:40:55Z",
        level: "info",
        message: "\u0422\u0435\u0441\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043a\u043e\u0434\u0430...",
      },
      {
        id: "log-ag-7",
        timestamp: "2026-02-05T15:42:00Z",
        level: "info",
        message: "\u041f\u0440\u043e\u0435\u043a\u0442 \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d. \u0413\u043e\u0442\u043e\u0432 \u043a \u0434\u0435\u043f\u043b\u043e\u044e.",
      },
    ],
  },

  // 5. Support Bot - draft
  {
    id: "f7e5a6b8-c9d0-1234-efab-345678901234",
    name: "Support Bot",
    emoji: "\uD83D\uDCAC",
    description:
      "\u0411\u043e\u0442 \u0442\u0435\u0445\u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438 \u0441 \u0441\u0438\u0441\u0442\u0435\u043c\u043e\u0439 \u0442\u0438\u043a\u0435\u0442\u043e\u0432, \u043e\u0442\u0441\u043b\u0435\u0436\u0438\u0432\u0430\u043d\u0438\u0435\u043c \u0441\u0442\u0430\u0442\u0443\u0441\u043e\u0432 \u043e\u0431\u0440\u0430\u0449\u0435\u043d\u0438\u0439 \u0438 \u0430\u0432\u0442\u043e-\u043e\u0442\u0432\u0435\u0442\u0430\u043c\u0438 \u043d\u0430 \u0442\u0438\u043f\u043e\u0432\u044b\u0435 \u0437\u0430\u043f\u0440\u043e\u0441\u044b.",
    status: "draft",
    category: "Telegram Bot",
    createdAt: "2026-02-06T08:00:00Z",
    updatedAt: "2026-02-06T08:00:00Z",
    config: {
      "Bot Framework": "aiogram 3.x",
      "\u042f\u0437\u044b\u043a": "Python 3.12",
      "\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445": "PostgreSQL",
      "\u0425\u043e\u0441\u0442\u0438\u043d\u0433": "Railway",
    },
    deployment: null,
    files: [],
    envVars: [],
    logs: [],
  },

  // 6. Weather Bot - failed
  {
    id: "a8f6b7c9-d0e1-2345-fabc-456789012345",
    name: "Weather Bot",
    emoji: "\u26C5",
    description:
      "\u0411\u043e\u0442 \u043f\u0440\u043e\u0433\u043d\u043e\u0437\u0430 \u043f\u043e\u0433\u043e\u0434\u044b \u0441 \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0435\u0439 OpenWeatherMap API. \u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442 \u0442\u0435\u043a\u0443\u0449\u0443\u044e \u043f\u043e\u0433\u043e\u0434\u0443, \u043f\u0440\u043e\u0433\u043d\u043e\u0437 \u043d\u0430 \u043d\u0435\u0434\u0435\u043b\u044e \u0438 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u043e\u0431 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f\u0445.",
    status: "failed",
    category: "Telegram Bot",
    createdAt: "2026-02-04T18:00:00Z",
    updatedAt: "2026-02-04T18:05:30Z",
    config: {
      "Bot Framework": "aiogram 3.x",
      "\u042f\u0437\u044b\u043a": "Python 3.12",
      "\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445": "Redis",
      "\u0425\u043e\u0441\u0442\u0438\u043d\u0433": "Railway",
    },
    deployment: null,
    files: MOCK_FILES,
    envVars: [
      ...MOCK_ENV_VARS,
      {
        id: "env-weather-1",
        key: "OPENWEATHER_API_KEY",
        value: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
        isRevealed: false,
      },
    ],
    logs: [
      {
        id: "log-fail-1",
        timestamp: "2026-02-04T18:00:00Z",
        level: "info",
        message: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043f\u0440\u043e\u0435\u043a\u0442\u0430 \u0437\u0430\u043f\u0443\u0449\u0435\u043d\u0430...",
      },
      {
        id: "log-fail-2",
        timestamp: "2026-02-04T18:00:05Z",
        level: "info",
        message: "\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u044b \u043f\u0440\u043e\u0435\u043a\u0442\u0430...",
      },
      {
        id: "log-fail-3",
        timestamp: "2026-02-04T18:01:30Z",
        level: "info",
        message: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u0438 \u0441 OpenWeatherMap...",
      },
      {
        id: "log-fail-4",
        timestamp: "2026-02-04T18:03:00Z",
        level: "warning",
        message: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u0430\u043b\u0438\u0434\u0438\u0440\u043e\u0432\u0430\u0442\u044c API-\u043a\u043b\u044e\u0447. \u041f\u043e\u0432\u0442\u043e\u0440\u043d\u0430\u044f \u043f\u043e\u043f\u044b\u0442\u043a\u0430...",
      },
      {
        id: "log-fail-5",
        timestamp: "2026-02-04T18:04:15Z",
        level: "error",
        message:
          "\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u0438: \u043f\u0440\u0435\u0432\u044b\u0448\u0435\u043d \u043b\u0438\u043c\u0438\u0442 \u0442\u043e\u043a\u0435\u043d\u043e\u0432 AI-\u043c\u043e\u0434\u0435\u043b\u0438",
      },
      {
        id: "log-fail-6",
        timestamp: "2026-02-04T18:04:16Z",
        level: "error",
        message:
          "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043f\u0440\u0435\u0440\u0432\u0430\u043d\u0430. \u041a\u043e\u0434 \u043e\u0448\u0438\u0431\u043a\u0438: GEN_TOKEN_LIMIT",
      },
      {
        id: "log-fail-7",
        timestamp: "2026-02-04T18:05:30Z",
        level: "error",
        message:
          "\u041f\u0440\u043e\u0435\u043a\u0442 \u043d\u0435 \u0431\u044b\u043b \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0443\u043f\u0440\u043e\u0441\u0442\u0438\u0442\u044c \u043a\u043e\u043d\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044e.",
      },
    ],
  },

  // 7. Reminder Bot - stopped
  {
    id: "b9a7c8d0-e1f2-3456-abcd-567890123456",
    name: "Reminder Bot",
    emoji: "\u23F0",
    description:
      "\u0411\u043e\u0442 \u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0439 \u0441 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u043e\u0439 \u043f\u043e\u0432\u0442\u043e\u0440\u044f\u044e\u0449\u0438\u0445\u0441\u044f \u0437\u0430\u0434\u0430\u0447, \u043a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u043d\u044b\u0445 \u0441\u043e\u0431\u044b\u0442\u0438\u0439 \u0438 \u0433\u0438\u0431\u043a\u0438\u043c \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430\u043c \u0447\u0430\u0441\u043e\u0432\u044b\u0445 \u043f\u043e\u044f\u0441\u043e\u0432.",
    status: "stopped",
    category: "Telegram Bot",
    createdAt: "2026-01-10T14:00:00Z",
    updatedAt: "2026-02-02T20:30:00Z",
    config: {
      "Bot Framework": "aiogram 3.x",
      "\u042f\u0437\u044b\u043a": "Python 3.12",
      "\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445": "PostgreSQL",
      "\u0425\u043e\u0441\u0442\u0438\u043d\u0433": "Railway",
    },
    deployment: {
      url: "https://reminder-bot-prod.up.railway.app",
      botUsername: "@viably_reminder_bot",
      status: "stopped",
      runningSince: null,
      costEstimate: "$1.80/\u043c\u0435\u0441",
    },
    files: MOCK_FILES,
    envVars: MOCK_ENV_VARS,
    logs: [
      {
        id: "log-stop-1",
        timestamp: "2026-01-25T08:00:00Z",
        level: "info",
        message: "Bot started successfully",
      },
      {
        id: "log-stop-2",
        timestamp: "2026-01-25T08:00:01Z",
        level: "info",
        message: "Polling started",
      },
      {
        id: "log-stop-3",
        timestamp: "2026-01-25T08:00:05Z",
        level: "info",
        message: "Connected to PostgreSQL database",
      },
      {
        id: "log-stop-4",
        timestamp: "2026-01-28T14:22:10Z",
        level: "warning",
        message:
          "\u041f\u0440\u0435\u0432\u044b\u0448\u0435\u043d \u043b\u0438\u043c\u0438\u0442 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0439 \u0434\u043b\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f 582041739",
      },
      {
        id: "log-stop-5",
        timestamp: "2026-01-30T09:15:00Z",
        level: "info",
        message: "Scheduled cleanup: removed 47 expired reminders",
      },
      {
        id: "log-stop-6",
        timestamp: "2026-02-01T11:30:00Z",
        level: "warning",
        message:
          "\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u043b \u0431\u043e\u0442\u0430: telegram_id=291048573",
      },
      {
        id: "log-stop-7",
        timestamp: "2026-02-02T16:45:00Z",
        level: "info",
        message: "Health check passed: all services operational",
      },
      {
        id: "log-stop-8",
        timestamp: "2026-02-02T20:00:00Z",
        level: "warning",
        message:
          "\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0430 \u043a\u043e\u043c\u0430\u043d\u0434\u0430 \u043d\u0430 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0443 \u0431\u043e\u0442\u0430",
      },
      {
        id: "log-stop-9",
        timestamp: "2026-02-02T20:00:02Z",
        level: "info",
        message:
          "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0438\u0435 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u0437\u0430\u0434\u0430\u0447...",
      },
      {
        id: "log-stop-10",
        timestamp: "2026-02-02T20:00:05Z",
        level: "info",
        message:
          "\u041e\u0442\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u043e\u0442 \u0431\u0430\u0437\u044b \u0434\u0430\u043d\u043d\u044b\u0445...",
      },
      {
        id: "log-stop-11",
        timestamp: "2026-02-02T20:00:06Z",
        level: "info",
        message: "Bot stopped gracefully",
      },
      {
        id: "log-stop-12",
        timestamp: "2026-02-02T20:30:00Z",
        level: "info",
        message:
          "\u0414\u0435\u043f\u043b\u043e\u0439 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u043c",
      },
    ],
  },
]
