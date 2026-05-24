#!/bin/bash
set -e

echo "🚀 Deploying FAQ Bot..."

pip install -r requirements.txt

if [ ! -f .env ]; then
    echo "❌ .env not found! Copy .env.example first."
    exit 1
fi

nohup python bot.py > bot.log 2>&1 &
echo $! > bot.pid

echo "✅ FAQ Bot deployed! PID: $(cat bot.pid)"
