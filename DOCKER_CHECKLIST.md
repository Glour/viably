# ✅ Docker Setup Checklist

Используйте этот чеклист перед первым запуском проекта.

## 📋 Перед запуском

- [ ] Docker установлен и запущен
  ```bash
  docker --version
  docker compose version
  ```

- [ ] Файлы .env существуют
  ```bash
  ls backend/.env
  ls frontend/.env.local
  ```

- [ ] В `backend/.env` установлен JWT_SECRET_KEY (не "change-me-...")
  ```bash
  grep "JWT_SECRET_KEY" backend/.env
  ```

- [ ] В `backend/.env` правильные хосты для Docker:
  - `DATABASE_URL`: содержит `@postgres:5432` (не `@localhost`)
  - `CELERY_BROKER_URL`: содержит `redis://redis:6379` (не `localhost`)

## 🚀 Первый запуск

- [ ] Запустить проект
  ```bash
  ./start.sh
  ```

- [ ] Дождаться запуска всех сервисов (30-60 секунд)

- [ ] Проверить статус
  ```bash
  docker compose ps
  ```
  Все сервисы должны быть `Up` и `healthy`

## 🧪 Проверка работоспособности

- [ ] Frontend доступен
  ```bash
  curl http://localhost:3000
  # или откройте в браузере
  ```

- [ ] Backend API доступен
  ```bash
  curl http://localhost:8000/health
  ```
  Должен вернуть `{"status":"healthy"}`

- [ ] API Docs доступны
  ```
  http://localhost:8000/docs
  ```

- [ ] PostgreSQL работает
  ```bash
  docker compose exec postgres psql -U postgres -d viably -c "SELECT version();"
  ```

- [ ] Redis работает
  ```bash
  docker compose exec redis redis-cli ping
  ```
  Должен вернуть `PONG`

## 📊 Логи без ошибок

- [ ] Проверить логи backend
  ```bash
  docker compose logs backend | grep -i error
  ```
  Не должно быть критических ошибок

- [ ] Проверить логи frontend
  ```bash
  docker compose logs frontend | grep -i error
  ```

- [ ] Проверить логи worker
  ```bash
  docker compose logs worker
  ```

## 🎯 Функциональная проверка

- [ ] Можно зарегистрироваться
  - Открыть http://localhost:3000/auth/register
  - Создать аккаунт
  - Проверить, что перенаправляет на dashboard

- [ ] Можно войти
  - Открыть http://localhost:3000/auth/login
  - Войти с созданным аккаунтом

- [ ] Dashboard загружается
  - http://localhost:3000/dashboard

- [ ] Templates Gallery загружается
  - http://localhost:3000/templates

## 🔧 Дополнительно (опционально)

- [ ] Добавить ANTHROPIC_API_KEY для AI-генерации
  ```bash
  # В backend/.env добавьте:
  ANTHROPIC_API_KEY=sk-ant-...
  ```
  Затем перезапустите:
  ```bash
  docker compose restart backend worker
  ```

- [ ] Проверить AI-генерацию
  - Создать новый проект в UI
  - Запустить генерацию
  - Проверить логи worker: `docker compose logs -f worker`

## 🐛 Если что-то не работает

- [ ] Посмотреть логи всех сервисов
  ```bash
  docker compose logs -f
  ```

- [ ] Проверить, что порты не заняты
  ```bash
  lsof -i :3000  # Frontend
  lsof -i :8000  # Backend
  lsof -i :5432  # PostgreSQL
  lsof -i :6379  # Redis
  ```

- [ ] Перезапустить с чистого листа
  ```bash
  docker compose down -v
  docker compose up --build
  ```

- [ ] Проверить документацию
  - [QUICKSTART.md](QUICKSTART.md)
  - [DOCKER_SETUP.md](DOCKER_SETUP.md)

## ✅ Все работает!

Если все пункты отмечены, ваш Viably готов к разработке! 🎉

**Далее:**
1. Изучите [DOCKER_SETUP.md](DOCKER_SETUP.md) для подробных команд
2. Начните разработку с hot reload
3. Используйте `make help` для удобных команд
