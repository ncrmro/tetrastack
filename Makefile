# DC normally is docker compose, but podman compose is used if available
DC:=docker compose $(DC_ARGS)

.PHONY: help build up down lint format migrate destroy migration-reconcile ci e2e coverage

help: ## List all available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

# Local development variables
WEB_PORT ?= $(shell grep WEB_PORT .env 2>/dev/null | cut -d '=' -f2 || echo 3000)
DB_PORT ?= $(shell grep DB_PORT .env 2>/dev/null | cut -d '=' -f2 || echo 8080)

build: ## Build all services without dependencies
	npm run build

up: ## Start local dev environment (Next.js + LibSQL) using concurrently
	@echo "Starting local development environment..."
	@mkdir -p data
	@chmod +x ./scripts/migrate-with-wait.sh
	@export DATABASE_URL="http://127.0.0.1:$(DB_PORT)" && \
	concurrently \
		--names "WEB,DATABASE,INIT" \
		--prefix-colors "blue,green,yellow" \
		--kill-others-on-fail \
		"npm run dev -- --port $(WEB_PORT)" \
		"sqld --http-listen-addr 127.0.0.1:$(DB_PORT) --db-path ./data/sqld.db" \
		"./scripts/migrate-with-wait.sh"

down: ## Stop all services (helper to kill ports if needed)
	@echo "Stopping services on ports $(WEB_PORT) and $(DB_PORT)..."
	@lsof -ti :$(WEB_PORT) | xargs -r kill
	@lsof -ti :$(DB_PORT) | xargs -r kill

lint: ## Run linting
	npm run lint
	npm run typecheck

format: ## Format code with Prettier and ESLint --fix
	npm run format

install: ## Install npm packages
	npm install

test-unit: ## Run unit tests
	npm run test:unit

test-integration: ## Run integration tests
	@export DATABASE_URL="http://127.0.0.1:$(DB_PORT)" && \
	npm run test:integration

test-components: ## Run component tests
	npm run test:components

test-agents: ## Run agent tests
	@export DATABASE_URL="http://127.0.0.1:$(DB_PORT)" && \
	npm run test:agents

test-all: ## Run all tests
	npm run test:unit
	npm run test:integration
	npm run test:components
	npm run test:e2e

migrate: ## Run database migrations
	@export DATABASE_URL="http://127.0.0.1:$(DB_PORT)" && \
	npm run db:migrate

destroy: ## Clean all services and delete database files
	rm -rf ./data/sqld.db*
	rm -rf .next
	rm -rf node_modules

migration-reconcile: ## Reset drizzle folder from main branch and regenerate migrations
	## Can be used to regenerate migrations after rebasing on a branch with migration conflicts
	## or consolidating multiple migrations on a feature branch before merging
	rm -rf ./drizzle
	git fetch
	git checkout origin/main -- drizzle
	npm run db:generate

# CI pipeline: lint + all tests
ci: ## Run full CI pipeline: lint and all tests including e2e
	@echo "Running linting..."
	@npm run lint
	@npm run typecheck
	@echo "Running unit tests..."
	@npm run test:unit
	@echo "Running integration tests..."
	@npm run test:integration
	@echo "Running e2e tests..."
	@npm run test:e2e
	@echo "✓ CI complete"

e2e: ## Run e2e tests
	@export DATABASE_URL="http://127.0.0.1:$(DB_PORT)" && \
	npm run test:e2e

coverage: ## Run tests with coverage report
	npm run coverage