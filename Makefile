# DC normally is docker compose, but podman compose is used if available
DC:=docker compose $(DC_ARGS)

.PHONY: help build up down lint format migrate destroy migration-reconcile ci e2e coverage

help: ## List all available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

build: ## Build all services without dependencies
	$(DC) run --env NODE_ENV=production --rm --no-deps web npm run build

up: ## Start all services in detached mode, run migrations, and follow logs
	$(DC) up -d db app-init
	$(DC) up db-init
	$(DC) up -d web
	@echo ""
	@echo "✓ Services started successfully!"
	@PORT=$$(grep WEB_PORT .env 2>/dev/null | cut -d '=' -f2); echo "→ Web server: http://localhost:$${PORT:-3000}"
	@echo ""

down: ## Stop all services
	$(DC) down --remove-orphans

lint: ## Run linting (Docker-based, no service dependencies)
	$(DC) run --rm --no-deps web npm run lint
	$(DC) run --rm --no-deps web npm run typecheck

format: ## Format code with Prettier and ESLint --fix (Docker-based, no service dependencies)
	$(DC) run --rm --no-deps web npm run format

install: ## Install npm packages (Docker-based, no service dependencies)
	$(DC) run --rm --no-deps web npm install

test-unit: ## Run unit tests (Docker-based, no service dependencies)
	$(DC) run --rm --no-deps web npm run test:unit

test-integration: ## Run integration tests (Docker-based, starts db service)
	$(DC) run --rm web npm run test:integration

test-components: ## Run component tests (Docker-based, no service dependencies)
	$(DC) run --rm --no-deps web npm run test:components

test-agents: ## Run agent tests (Docker-based, starts db service)
	$(DC) run --rm web npm run test:agents

test-all: ## Run all tests including e2e (Docker-based)
	$(DC) run --rm --no-deps web npm run test:unit
	$(DC) run --rm web npm run test:integration
	$(DC) run --rm --no-deps web npm run test:components
	$(DC) --profile e2e run --rm e2e

migrate: ## Run database migrations in Docker
	$(DC) up db-migrate

destroy: ## Clean all services and delete database files
	$(DC) down --remove-orphans --volumes
	rm -rf ./data/libsql/*
	rm -rf .next

migration-reconcile: ## Reset drizzle folder from main branch and regenerate migrations
	## Can be used to regenerate migrations after rebasing on a branch with migration conflicts
	## or consolidating multiple migrations on a feature branch before merging
	rm -rf ./drizzle
	git fetch
	git checkout origin/main -- drizzle
	npm run db:generate

# CI pipeline: lint + all tests (Docker-based)
ci: ## Run full CI pipeline: lint and all tests including e2e
	@echo "Running linting..."
	@$(DC) run --rm --no-deps web npm run lint
	@$(DC) run --rm --no-deps web npm run typecheck
	@echo "Running unit tests..."
	@$(DC) run --rm --no-deps web npm run test:unit
	@echo "Running integration tests..."
	@$(DC) run --rm web npm run test:integration
	@echo "Running e2e tests..."
	@$(DC) --profile e2e run --rm e2e
	@echo "✓ CI complete"

e2e: ## Run e2e tests in Docker
	$(DC) --profile e2e run --rm e2e

coverage: ## Run tests with coverage report
	$(DC) run --rm web npm run coverage
