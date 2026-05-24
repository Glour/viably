#!/bin/bash
set -e

echo "🚀 Deploying Shop Bot..."

# Установка зависимостей
pip install -r requirements.txt

# Проверка .env
if [ ! -f .env ]; then
    echo "❌ .env file not found! Copy .env.example and configure it."
    exit 1
fi

# Запуск в фоне
nohup python bot.py > bot.log 2>&1 &
echo $! > bot.pid

echo "✅ Shop Bot deployed! PID: $(cat bot.pid)"
echo "📋 Logs: tail -f bot.log"
echo "🛑 Stop: kill $(cat bot.pid)"
