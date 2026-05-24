.PHONY: help start stop restart logs build clean ps migrate dev prod

# ─────────────────────────────────────────────
# Auto-detect profile from current git branch
# develop/* → dev, main/master/release/* → prod
# ─────────────────────────────────────────────
BRANCH := $(shell git branch --show-current 2>/dev/null || echo main)
ifeq ($(filter develop%,$(BRANCH)),$(BRANCH))
  PROFILE ?= dev
else ifeq ($(BRANCH),dev)
  PROFILE ?= dev
else
  PROFILE ?= prod
endif

COMPOSE := docker compose --profile $(PROFILE)

# ─────────────────────────────────────────────

help:
	@echo "Viably — Docker Compose commands"
	@echo ""
	@echo "Current branch : $(BRANCH)"
	@echo "Active profile : $(PROFILE)"
	@echo ""
	@echo "  make start          - Start services (auto-detect profile)"
	@echo "  make dev            - Force dev profile"
	@echo "  make prod           - Force prod profile"
	@echo "  make stop           - Stop services"
	@echo "  make restart        - Restart services"
	@echo "  make build          - Rebuild images"
	@echo "  make logs           - Follow all logs"
	@echo "  make logs-backend   - Follow backend logs"
	@echo "  make logs-frontend  - Follow frontend logs"
	@echo "  make logs-worker    - Follow worker logs"
	@echo "  make ps             - Show service status"
	@echo "  make clean          - Stop and remove all data (DESTRUCTIVE)"
	@echo "  make migrate        - Run database migrations"

# Reconnect standalone bot containers to the compose network after restart.
# docker compose recreate can rebuild the network, disconnecting bots.
reconnect-bots:
	@for c in $$(docker ps -q --filter "name=viably-deploy-"); do \
		name=$$(docker inspect --format '{{.Name}}' $$c | sed 's|^/||'); \
		docker network connect viably-network $$c 2>/dev/null \
			&& echo "Reconnected $$name" \
			|| true; \
	done

# Start with auto-detected profile
start:
	@echo "Starting Viably [profile=$(PROFILE), branch=$(BRANCH)]..."
	$(COMPOSE) up -d
	@$(MAKE) --no-print-directory reconnect-bots

# Force dev
dev:
	@echo "Starting Viably [profile=dev]..."
	docker compose --profile dev up -d
	@$(MAKE) --no-print-directory reconnect-bots

# Force prod
prod:
	@echo "Starting Viably [profile=prod]..."
	docker compose --profile prod up -d
	@$(MAKE) --no-print-directory reconnect-bots

stop:
	@echo "Stopping Viably..."
	$(COMPOSE) down

restart:
	@echo "Restarting Viably..."
	$(COMPOSE) restart

build:
	@echo "Building images [profile=$(PROFILE)]..."
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend-$(PROFILE)

logs-frontend:
	$(COMPOSE) logs -f frontend-$(PROFILE)

logs-worker:
	$(COMPOSE) logs -f worker-$(PROFILE)

ps:
	$(COMPOSE) ps

clean:
	@echo "WARNING: This will remove all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose --profile dev --profile prod down -v; \
		echo "Cleaned."; \
	fi

migrate:
	@echo "Running migrations [profile=$(PROFILE)]..."
	$(COMPOSE) exec backend-$(PROFILE) alembic -c alembic.ini upgrade head

migrate-create:
	@read -p "Migration name: " name; \
	$(COMPOSE) exec backend-$(PROFILE) alembic -c alembic.ini revision --autogenerate -m "$$name"

shell-backend:
	$(COMPOSE) exec backend-$(PROFILE) python

shell-db:
	docker compose exec postgres psql -U postgres -d viably

test-backend:
	$(COMPOSE) exec backend-$(PROFILE) pytest

test-backend-cov:
	$(COMPOSE) exec backend-$(PROFILE) pytest --cov=app

test-frontend:
	$(COMPOSE) exec frontend-$(PROFILE) npm test
