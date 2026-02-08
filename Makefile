.PHONY: help start stop restart logs build clean ps migrate test

# Default target
help:
	@echo "🚀 Viably - Docker Development Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make start       - Start all services"
	@echo "  make stop        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - Show logs (all services)"
	@echo "  make logs-backend - Show backend logs"
	@echo "  make logs-frontend - Show frontend logs"
	@echo "  make logs-worker - Show worker logs"
	@echo "  make build       - Rebuild all images"
	@echo "  make ps          - Show service status"
	@echo "  make clean       - Stop and remove all data"
	@echo "  make migrate     - Run database migrations"
	@echo "  make shell-backend - Open backend shell"
	@echo "  make shell-db    - Open PostgreSQL shell"
	@echo "  make test-backend - Run backend tests"
	@echo "  make test-frontend - Run frontend tests"

# Start services
start:
	@echo "🚀 Starting Viably..."
	./start.sh

# Stop services
stop:
	@echo "🛑 Stopping Viably..."
	docker compose down

# Restart services
restart:
	@echo "♻️  Restarting Viably..."
	docker compose restart

# Show logs
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-worker:
	docker compose logs -f worker

# Build images
build:
	@echo "🔨 Building images..."
	docker compose build

# Show status
ps:
	docker compose ps

# Clean everything (including data!)
clean:
	@echo "⚠️  This will remove all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "✅ Cleaned!"; \
	fi

# Database migrations
migrate:
	@echo "🗄️  Running migrations..."
	docker compose exec backend alembic upgrade head

migrate-create:
	@read -p "Migration name: " name; \
	docker compose exec backend alembic revision --autogenerate -m "$$name"

# Shells
shell-backend:
	docker compose exec backend python

shell-db:
	docker compose exec postgres psql -U postgres -d viably

# Tests
test-backend:
	docker compose exec backend pytest

test-backend-cov:
	docker compose exec backend pytest --cov=app

test-frontend:
	docker compose exec frontend npm test
