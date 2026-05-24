#!/bin/bash
set -e

cd /home/viably

echo "🚀 Viably Deploy — $(date)"

# Pull latest code if git repo
if [ -d .git ]; then
  echo "📥 Pulling latest code..."
  git pull --ff-only 2>/dev/null || echo "⚠️ Git pull skipped"
fi

# Rebuild all services
echo "🔨 Building backend..."
docker compose build backend-prod worker-prod --quiet

echo "🔨 Building frontend (no cache)..."
docker compose build frontend-prod --no-cache --quiet

# Restart everything cleanly (auto-detect profile from git branch via Makefile)
echo "♻️ Restarting services..."
make stop 2>/dev/null || true
make start

# Wait for health
echo "⏳ Waiting for services..."
sleep 5

# Verify
backend_status=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/health 2>/dev/null || echo "000")
frontend_status=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo "000")

echo "✅ Backend: $backend_status | Frontend: $frontend_status"

# Clear Redis cache to avoid stale data
docker compose exec -T redis redis-cli FLUSHDB > /dev/null 2>&1 || true
echo "🗑️ Redis cache cleared"

# Cleanup old images
docker image prune -f > /dev/null 2>&1 || true
echo "🧹 Old images cleaned"

echo "✅ Deploy complete!"
