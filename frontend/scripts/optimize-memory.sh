#!/bin/bash
set -e

echo "🚀 Быстрая оптимизация памяти фронтенда (15 минут)"
echo "=================================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
log_step() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Проверка, что мы в директории frontend
if [ ! -f "package.json" ]; then
  log_error "package.json не найден. Запустите скрипт из директории frontend/"
  exit 1
fi

echo "📊 Текущие размеры:"
du -sh node_modules/ .next/ 2>/dev/null || echo "Директории не найдены"
echo ""

# Шаг 1: Очистка кэшей
echo "🧹 Шаг 1/5: Очистка кэшей..."
if [ -d ".next/cache" ]; then
  rm -rf .next/cache
  log_step "Кэш .next очищен"
else
  log_warn ".next/cache не найден"
fi

npm cache clean --force 2>/dev/null || log_warn "npm cache уже чист"
log_step "npm cache очищен"
echo ""

# Шаг 2: Удаление дубликатов
echo "🔄 Шаг 2/5: Удаление дубликатов зависимостей..."
npm dedupe 2>/dev/null && log_step "npm dedupe выполнен" || log_warn "npm dedupe пропущен"
npm prune 2>/dev/null && log_step "npm prune выполнен" || log_warn "npm prune пропущен"
echo ""

# Шаг 3: Перенос dev-only зависимостей
echo "📦 Шаг 3/5: Перенос dev-only зависимостей в devDependencies..."
PACKAGES_TO_MOVE=(
  "react-email"
  "@react-email/components"
)

for pkg in "${PACKAGES_TO_MOVE[@]}"; do
  if grep -q "\"$pkg\"" package.json; then
    log_step "Перемещаем $pkg..."
    npm install -D "$pkg" 2>/dev/null || log_warn "Не удалось переместить $pkg"
  else
    log_warn "$pkg не найден в dependencies"
  fi
done
echo ""

# Шаг 4: Отключение sourcemaps в dev (опционально)
echo "🗺️ Шаг 4/5: Настройка sourcemaps..."
if [ ! -f ".env.local" ]; then
  touch .env.local
fi

if ! grep -q "GENERATE_SOURCEMAP" .env.local; then
  echo "GENERATE_SOURCEMAP=false" >> .env.local
  log_step "Sourcemaps отключены в .env.local"
else
  log_warn "GENERATE_SOURCEMAP уже настроен"
fi
echo ""

# Шаг 5: Финальная проверка
echo "✅ Шаг 5/5: Проверка результатов..."
echo ""
echo "📊 Новые размеры:"
du -sh node_modules/ .next/ 2>/dev/null || echo "Директории не найдены"
echo ""

# Рекомендации
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_step "Быстрая оптимизация завершена!"
echo ""
echo "📋 Следующие шаги для дополнительной оптимизации:"
echo "   1. Заменить Monaco Editor → Prism (экономия ~70MB)"
echo "   2. Условная загрузка Sentry/PostHog (экономия ~84MB)"
echo "   3. Оптимизировать импорты Lucide icons (экономия ~30MB)"
echo ""
echo "📖 Смотрите полный отчет:"
echo "   .tmp/current/memory-optimization-report.md"
echo ""
echo "🔍 Проверить bundle size:"
echo "   ANALYZE=true npm run build"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
