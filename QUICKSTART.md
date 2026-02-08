# ⚡ Viably - Быстрый старт

## 🎯 За 3 команды

```bash
# 1. Убедитесь, что Docker запущен
docker --version

# 2. Запустите проект
./start.sh

# 3. Откройте браузер
open http://localhost:3000
```

## 📝 Что происходит?

**start.sh автоматически:**
1. ✅ Проверяет Docker
2. ✅ Создает .env файлы (если их нет)
3. ✅ Собирает Docker образы
4. ✅ Запускает все сервисы:
   - PostgreSQL (порт 5432)
   - Redis (порт 6379)
   - Backend API (порт 8000)
   - Celery Worker (AI генерация)
   - Frontend (порт 3000)

## 🌐 URLs

| Сервис        | URL                            |
|---------------|--------------------------------|
| **Frontend**  | http://localhost:3000          |
| **Backend**   | http://localhost:8000          |
| **API Docs**  | http://localhost:8000/docs     |
| **API Health**| http://localhost:8000/health   |

## 🔧 Полезные команды

```bash
# Просмотр логов
docker compose logs -f

# Просмотр логов конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f worker

# Остановить
./stop.sh
# или
docker compose down

# Перезапуск
docker compose restart

# Пересборка после изменений в зависимостях
docker compose up --build
```

## 🐛 Если что-то не работает

```bash
# Полная очистка и перезапуск
docker compose down -v
docker compose up --build

# Проверить статус
docker compose ps

# Проверить логи
docker compose logs -f
```

## 📚 Подробная документация

См. [DOCKER_SETUP.md](./DOCKER_SETUP.md) для полной документации.

## 🔐 Первый запуск

При первом запуске:

1. **Backend** автоматически создаст таблицы в БД
2. **Frontend** будет доступен сразу
3. **Celery Worker** будет готов к AI-генерации

Вам нужно только:
- Зарегистрироваться через UI: http://localhost:3000/auth/register
- Добавить `ANTHROPIC_API_KEY` в `backend/.env` для AI-генерации

## ✨ Hot Reload

Оба сервиса поддерживают hot reload:
- **Backend**: автоматически перезагружается при изменении `.py` файлов
- **Frontend**: автоматически перезагружается при изменении `.ts`, `.tsx` файлов

Просто редактируйте код - изменения применятся автоматически! 🚀
