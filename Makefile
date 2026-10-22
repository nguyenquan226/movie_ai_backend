# ============================================================================
# ChillFlix Backend - Makefile
# ============================================================================
# Usage: make <target>
# Run `make help` to see all available commands.
# ============================================================================

.PHONY: help install install-ci setup dev start debug prod build clean \
        services-up services-down services-restart \
        db-up db-down db-clean redis-up redis-down redis-clean elastic-up elastic-down elastic-clean \
        docker-build docker-ps docker-logs docker-clean docker-reset \
        db-logs redis-logs elastic-logs \
        lint lint-fix format format-check test test-watch test-cov test-e2e test-integration test-debug \
        db-migrate db-migration-revert db-migration-generate \
        env-setup check-env check-deps status fresh ensure-services

# Pass MIGRATION=NameOfMigration when generating a migration.
MIGRATION ?=

# Colors for help output
CYAN    := \033[36m
GREEN   := \033[32m
YELLOW  := \033[33m
RED     := \033[31m
BOLD    := \033[1m
RESET   := \033[0m

# ============================================================================
# DEFAULT TARGET
# ============================================================================

.DEFAULT_GOAL := help

# ============================================================================
# HELP
# ============================================================================

help: ## Show this help message
	@echo "ChillFlix Backend commands:"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  make %-24s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ============================================================================
# SETUP & DEPENDENCIES
# ============================================================================

install: ## Install all npm dependencies
	@echo "$(BOLD)$(GREEN)Installing dependencies...$(RESET)"
	npm install
	@echo "$(BOLD)$(GREEN)Dependencies installed successfully!$(RESET)"

install-ci: ## Install locked npm dependencies for CI (npm ci)
	npm ci

env-setup: ## Create .env from .env.example if it doesn't exist
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(BOLD)$(GREEN).env file created from .env.example$(RESET)"; \
		echo "$(BOLD)$(YELLOW)Please edit .env and fill in your configuration values$(RESET)"; \
	else \
		echo "$(BOLD)$(YELLOW).env file already exists, skipping...$(RESET)"; \
	fi

setup: env-setup services-up install ## Full project setup (env + docker + install)
	@echo ""
	@echo "$(BOLD)$(GREEN)Project setup complete!$(RESET)"
	@echo "$(BOLD)$(YELLOW)Don't forget to configure your .env file$(RESET)"
	@echo "$(BOLD)$(CYAN)Run 'make dev' to start the application$(RESET)"

fresh: ## Clean reinstall (remove node_modules + reinstall)
	@echo "$(BOLD)$(YELLOW)Removing node_modules and dist...$(RESET)"
	rm -rf node_modules dist
	@echo "$(BOLD)$(GREEN)Reinstalling dependencies...$(RESET)"
	npm install
	@echo "$(BOLD)$(GREEN)Fresh install complete!$(RESET)"

# ============================================================================
# APPLICATION
# ============================================================================

ensure-services: ## Check and auto-start required services (PostgreSQL + Redis)
	@echo "$(BOLD)$(CYAN)Checking required services...$(RESET)"
	@PG_RUNNING=$$(docker ps --filter "name=postgres-db" --filter "status=running" -q 2>/dev/null); \
	REDIS_RUNNING=$$(docker ps --filter "name=redis-db" --filter "status=running" -q 2>/dev/null); \
	NEED_START=""; \
	if [ -z "$$PG_RUNNING" ]; then \
		echo "  $(YELLOW)PostgreSQL is not running$(RESET)"; \
		NEED_START="yes"; \
	else \
		echo "  $(GREEN)✓ PostgreSQL is running$(RESET)"; \
	fi; \
	if [ -z "$$REDIS_RUNNING" ]; then \
		echo "  $(YELLOW)Redis is not running$(RESET)"; \
		NEED_START="yes"; \
	else \
		echo "  $(GREEN)✓ Redis is running$(RESET)"; \
	fi; \
	if [ -n "$$NEED_START" ]; then \
		echo ""; \
		echo "$(BOLD)$(GREEN)Auto-starting missing services...$(RESET)"; \
		if [ -z "$$PG_RUNNING" ]; then \
			docker compose --profile db up -d postgres; \
		fi; \
		if [ -z "$$REDIS_RUNNING" ]; then \
			docker compose --profile cache up -d redis; \
		fi; \
		echo "$(BOLD)$(GREEN)Services started!$(RESET)"; \
		echo "$(BOLD)$(CYAN)Waiting for services to be healthy...$(RESET)"; \
		sleep 3; \
	else \
		echo "  $(GREEN)All required services are running!$(RESET)"; \
	fi
	@echo ""

dev: ensure-services ## Start app in development mode (auto-starts services)
	@echo "$(BOLD)$(GREEN)Starting in development mode...$(RESET)"
	npm run dev

start: ## Start app in default mode
	@echo "$(BOLD)$(GREEN)Starting application...$(RESET)"
	npm run start

debug: ## Start app in debug mode (watch + inspect)
	@echo "$(BOLD)$(GREEN)Starting in debug mode...$(RESET)"
	npm run start:debug

prod: build ## Start app in production mode
	@echo "$(BOLD)$(GREEN)Starting in production mode...$(RESET)"
	npm run start:prod

build: ## Build the project for production
	@echo "$(BOLD)$(GREEN)Building project...$(RESET)"
	npm run build
	@echo "$(BOLD)$(GREEN)Build complete!$(RESET)"

clean: ## Remove generated build and coverage artifacts
	@echo "$(BOLD)$(YELLOW)Cleaning build artifacts...$(RESET)"
	rm -rf dist coverage
	@echo "$(BOLD)$(GREEN)Clean complete!$(RESET)"

# ============================================================================
# DOCKER - INDIVIDUAL SERVICES
# ============================================================================

db-up: ## Start PostgreSQL only
	@echo "$(BOLD)$(GREEN)Starting PostgreSQL...$(RESET)"
	docker compose --profile db up -d postgres
	@echo "$(BOLD)$(GREEN)PostgreSQL started at localhost:5432$(RESET)"

db-down: ## Stop PostgreSQL
	@echo "$(BOLD)$(YELLOW)Stopping PostgreSQL...$(RESET)"
	docker compose --profile db stop postgres
	@echo "$(BOLD)$(GREEN)PostgreSQL stopped!$(RESET)"

redis-up: ## Start Redis only
	@echo "$(BOLD)$(GREEN)Starting Redis...$(RESET)"
	docker compose --profile cache up -d redis
	@echo "$(BOLD)$(GREEN)Redis started at localhost:6379$(RESET)"

redis-down: ## Stop Redis
	@echo "$(BOLD)$(YELLOW)Stopping Redis...$(RESET)"
	docker compose --profile cache stop redis
	@echo "$(BOLD)$(GREEN)Redis stopped!$(RESET)"

elastic-up: ## Start Elasticsearch only
	@echo "$(BOLD)$(GREEN)Starting Elasticsearch...$(RESET)"
	docker compose --profile search up -d elasticsearch
	@echo "$(BOLD)$(GREEN)Elasticsearch started at localhost:9200$(RESET)"

elastic-down: ## Stop Elasticsearch
	@echo "$(BOLD)$(YELLOW)Stopping Elasticsearch...$(RESET)"
	docker compose --profile search stop elasticsearch
	@echo "$(BOLD)$(GREEN)Elasticsearch stopped!$(RESET)"


db-clean: ## Remove PostgreSQL container and its data
	@echo "$(BOLD)$(RED)WARNING: This will delete all PostgreSQL data!$(RESET)"
	@echo "$(BOLD)$(YELLOW)Removing PostgreSQL container and volume...$(RESET)"
	docker compose --profile db down -v --remove-orphans
	@echo "$(BOLD)$(GREEN)PostgreSQL removed!$(RESET)"

redis-clean: ## Remove Redis container and its data
	@echo "$(BOLD)$(RED)WARNING: This will delete all Redis data!$(RESET)"
	@echo "$(BOLD)$(YELLOW)Removing Redis container and volume...$(RESET)"
	docker compose --profile cache down -v --remove-orphans
	@echo "$(BOLD)$(GREEN)Redis removed!$(RESET)"

elastic-clean: ## Remove Elasticsearch container and its data
	@echo "$(BOLD)$(RED)WARNING: This will delete all Elasticsearch data!$(RESET)"
	@echo "$(BOLD)$(YELLOW)Removing Elasticsearch container and volume...$(RESET)"
	docker compose --profile search down -v --remove-orphans
	@echo "$(BOLD)$(GREEN)Elasticsearch removed!$(RESET)"

# ============================================================================
# DOCKER - BATCH OPERATIONS
# ============================================================================

services-up: ## Start all services (PostgreSQL + Redis + Elasticsearch)
	@echo "$(BOLD)$(GREEN)Starting all services...$(RESET)"
	docker compose --profile db --profile cache --profile search up -d
	@echo "$(BOLD)$(GREEN)All services started!$(RESET)"
	@echo "  PostgreSQL:    localhost:5432"
	@echo "  Redis:         localhost:6379"
	@echo "  Elasticsearch: localhost:9200"

services-down: ## Stop all services
	@echo "$(BOLD)$(YELLOW)Stopping all services...$(RESET)"
	docker compose --profile db --profile cache --profile search down
	@echo "$(BOLD)$(GREEN)All services stopped!$(RESET)"

services-restart: services-down services-up ## Restart all services

docker-build: ## Build the backend Docker image
	docker build -t chillflix-backend .

docker-logs: ## Follow logs of all containers
	docker compose --profile db --profile cache --profile search logs -f

docker-ps: ## Show running containers status
	@echo "$(BOLD)$(CYAN)Container status:$(RESET)"
	docker compose --profile db --profile cache --profile search ps

docker-clean: ## Stop containers and remove volumes (data loss)
	@echo "$(BOLD)$(RED)WARNING: This will delete all data in PostgreSQL, Redis and Elasticsearch!$(RESET)"
	@echo "$(BOLD)$(YELLOW)Stopping containers and removing volumes...$(RESET)"
	docker compose --profile db --profile cache --profile search down -v
	@echo "$(BOLD)$(GREEN)Containers and volumes removed!$(RESET)"


docker-reset: ## Remove ALL containers, volumes and images, then restart fresh
	@echo "$(BOLD)$(RED)WARNING: This will delete ALL data and downloaded images!$(RESET)"
	@echo "$(BOLD)$(YELLOW)Removing all containers, volumes and images...$(RESET)"
	docker compose --profile db --profile cache --profile search down -v --rmi all --remove-orphans
	@echo "$(BOLD)$(GREEN)Everything removed! Run 'make services-up' to start fresh.$(RESET)"

# ============================================================================
# DOCKER - INDIVIDUAL SERVICE LOGS
# ============================================================================

db-logs: ## Follow PostgreSQL logs
	docker compose --profile db logs -f postgres

redis-logs: ## Follow Redis logs
	docker compose --profile cache logs -f redis

elastic-logs: ## Follow Elasticsearch logs
	docker compose --profile search logs -f elasticsearch

# ============================================================================
# TESTING
# ============================================================================

test: ## Run unit tests
	@echo "$(BOLD)$(GREEN)Running unit tests...$(RESET)"
	npm run test

test-watch: ## Run tests in watch mode
	@echo "$(BOLD)$(GREEN)Running tests in watch mode...$(RESET)"
	npm run test:watch

test-cov: ## Run tests with coverage report
	@echo "$(BOLD)$(GREEN)Running tests with coverage...$(RESET)"
	npm run test:cov

test-e2e: ## Run end-to-end tests
	@echo "$(BOLD)$(GREEN)Running e2e tests...$(RESET)"
	npm run test:e2e

test-integration: ## Run database-backed integration tests
	npm run test:integration

test-debug: ## Run tests in debug mode
	@echo "$(BOLD)$(GREEN)Running tests in debug mode...$(RESET)"
	npm run test:debug

# ============================================================================
# CODE QUALITY
# ============================================================================

lint: ## Check TypeScript files with ESLint
	@echo "$(BOLD)$(GREEN)Running ESLint...$(RESET)"
	npm run lint

lint-fix: ## Run ESLint and apply safe automatic fixes
	npx eslint "{src,apps,libs,test}/**/*.ts" --fix

format: ## Format code with Prettier
	@echo "$(BOLD)$(GREEN)Formatting code with Prettier...$(RESET)"
	npm run format

format-check: ## Check formatting without modifying files
	npx prettier --check "src/**/*.ts" "test/**/*.ts"

db-migrate: ## Apply pending TypeORM migrations
	npm run migration:run

db-migration-revert: ## Revert the latest TypeORM migration
	npm run migration:revert

db-migration-generate: ## Generate a migration (set MIGRATION=Name)
	@test -n "$(MIGRATION)" || (echo "Usage: make db-migration-generate MIGRATION=AddSomething"; exit 2)
	npm run migration:generate -- src/database/migrations/$(MIGRATION)

# ============================================================================
# UTILITIES
# ============================================================================

check-deps: ## Check if required tools are installed
	@echo "$(BOLD)$(CYAN)Checking required tools...$(RESET)"
	@echo ""
	@printf "  Node.js:         "; \
	if command -v node > /dev/null 2>&1; then \
		echo "$(GREEN)$$(node -v)$(RESET)"; \
	else \
		echo "$(RED)Not installed$(RESET)"; \
	fi
	@printf "  npm:             "; \
	if command -v npm > /dev/null 2>&1; then \
		echo "$(GREEN)v$$(npm -v)$(RESET)"; \
	else \
		echo "$(RED)Not installed$(RESET)"; \
	fi
	@printf "  Docker:          "; \
	if command -v docker > /dev/null 2>&1; then \
		echo "$(GREEN)$$(docker -v | cut -d' ' -f3 | tr -d ','  )$(RESET)"; \
	else \
		echo "$(RED)Not installed$(RESET)"; \
	fi
	@printf "  Docker Compose:  "; \
	if docker compose version > /dev/null 2>&1; then \
		echo "$(GREEN)$$(docker compose version --short)$(RESET)"; \
	else \
		echo "$(RED)Not installed$(RESET)"; \
	fi
	@printf "  NestJS CLI:      "; \
	if npx nest --version > /dev/null 2>&1; then \
		echo "$(GREEN)v$$(npx nest --version 2>/dev/null)$(RESET)"; \
	else \
		echo "$(YELLOW)Not installed (will use local via npx)$(RESET)"; \
	fi
	@echo ""

check-env: ## Verify .env file exists and show missing vars
	@echo "$(BOLD)$(CYAN)Checking environment configuration...$(RESET)"
	@echo ""
	@if [ ! -f .env ]; then \
		echo "  $(RED).env file not found!$(RESET)"; \
		echo "  $(YELLOW)Run 'make env-setup' to create it$(RESET)"; \
	else \
		echo "  $(GREEN).env file exists$(RESET)"; \
		echo ""; \
		echo "  $(BOLD)Empty variables:$(RESET)"; \
		grep -E "^[A-Z_]+=$$" .env 2>/dev/null | while read line; do \
			var=$$(echo "$$line" | cut -d'=' -f1); \
			echo "    $(YELLOW)$$var$(RESET)"; \
		done; \
		if ! grep -qE "^[A-Z_]+=$$" .env 2>/dev/null; then \
			echo "    $(GREEN)All variables have values$(RESET)"; \
		fi; \
	fi
	@echo ""

status: check-deps ## Show project status (containers, env, deps)
	@echo "$(BOLD)$(CYAN)Project Status$(RESET)"
	@echo ""
	@printf "  node_modules:    "; \
	if [ -d node_modules ]; then \
		echo "$(GREEN)Installed$(RESET)"; \
	else \
		echo "$(RED)Missing - run 'make install'$(RESET)"; \
	fi
	@printf "  .env file:       "; \
	if [ -f .env ]; then \
		echo "$(GREEN)Exists$(RESET)"; \
	else \
		echo "$(RED)Missing - run 'make env-setup'$(RESET)"; \
	fi
	@printf "  dist/ (build):   "; \
	if [ -d dist ]; then \
		echo "$(GREEN)Built$(RESET)"; \
	else \
		echo "$(YELLOW)Not built yet$(RESET)"; \
	fi
	@echo ""
	@echo "$(BOLD)$(CYAN)Docker Containers:$(RESET)"
	@docker compose --profile db --profile cache --profile search ps 2>/dev/null || echo "  $(RED)Docker is not running$(RESET)"
	@echo ""
