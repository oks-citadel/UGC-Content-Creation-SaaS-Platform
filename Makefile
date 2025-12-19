# =============================================================================
# CreatorBridge Platform Makefile
# =============================================================================
# Usage: make [target]
# Run 'make help' to see all available targets
# =============================================================================

.PHONY: help install dev build test lint clean deploy docker db

# Default target
.DEFAULT_GOAL := help

# Environment (can be overridden: make deploy ENV=production)
ENV ?= staging

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

# =============================================================================
# Help
# =============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(BLUE)CreatorBridge Platform - Available Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^(install|dev|build|test|lint|clean)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^db' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^docker' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Deployment:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^deploy' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -vE '^(install|dev|build|test|lint|clean|db|docker|deploy)' | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Development
# =============================================================================

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pnpm install

dev: ## Start development servers
	@echo "$(BLUE)Starting development environment...$(NC)"
	pnpm dev

dev-api: ## Start only API services in development
	@echo "$(BLUE)Starting API services...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d postgres redis
	pnpm dev:services

dev-web: ## Start only web apps in development
	@echo "$(BLUE)Starting web apps...$(NC)"
	pnpm dev:apps

build: ## Build all packages and services
	@echo "$(BLUE)Building project...$(NC)"
	pnpm build

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	pnpm test:run

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	pnpm test

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	pnpm test:coverage

test-e2e: ## Run E2E tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	pnpm test:e2e

test-integration: ## Run integration tests
	@echo "$(BLUE)Running integration tests...$(NC)"
	pnpm test:integration

lint: ## Run linting
	@echo "$(BLUE)Running linting...$(NC)"
	pnpm lint

lint-fix: ## Fix linting issues
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	pnpm lint:fix

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running type check...$(NC)"
	pnpm type-check

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	pnpm format

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	pnpm clean
	rm -rf node_modules/.cache
	rm -rf .turbo

clean-all: clean ## Clean everything including node_modules
	@echo "$(BLUE)Cleaning everything...$(NC)"
	rm -rf node_modules
	rm -rf */node_modules
	rm -rf */*/node_modules

# =============================================================================
# Database
# =============================================================================

db-start: ## Start database containers
	@echo "$(BLUE)Starting databases...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d postgres redis

db-stop: ## Stop database containers
	@echo "$(BLUE)Stopping databases...$(NC)"
	docker-compose -f docker-compose.dev.yml down

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	pnpm db:migrate

db-migrate-dev: ## Create and run new migration (dev only)
	@echo "$(BLUE)Running dev migrations...$(NC)"
	pnpm db:migrate:dev

db-generate: ## Generate Prisma client
	@echo "$(BLUE)Generating Prisma client...$(NC)"
	pnpm db:generate

db-seed: ## Seed databases with test data
	@echo "$(BLUE)Seeding databases...$(NC)"
	pnpm db:seed

db-reset: ## Reset databases (WARNING: destroys data)
	@echo "$(RED)WARNING: This will destroy all data!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] && pnpm db:reset

db-studio: ## Open Prisma Studio
	@echo "$(BLUE)Opening Prisma Studio...$(NC)"
	pnpm db:studio

db-backup: ## Backup databases
	@echo "$(BLUE)Backing up databases...$(NC)"
	./scripts/backup-databases.sh $(ENV)

db-restore: ## Restore databases (requires BACKUP env var)
	@echo "$(BLUE)Restoring databases...$(NC)"
	./scripts/restore-database.sh $(ENV) $(BACKUP)

# =============================================================================
# Docker
# =============================================================================

docker-build: ## Build all Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build

docker-build-prod: ## Build production Docker images
	@echo "$(BLUE)Building production Docker images...$(NC)"
	docker-compose -f docker-compose.prod.yml build

docker-up: ## Start all containers
	@echo "$(BLUE)Starting containers...$(NC)"
	docker-compose up -d

docker-down: ## Stop all containers
	@echo "$(BLUE)Stopping containers...$(NC)"
	docker-compose down

docker-logs: ## View container logs
	docker-compose logs -f

docker-ps: ## List running containers
	docker-compose ps

docker-prune: ## Remove unused Docker resources
	@echo "$(YELLOW)Pruning Docker resources...$(NC)"
	docker system prune -f
	docker volume prune -f

docker-push: ## Push images to registry
	@echo "$(BLUE)Pushing images to registry...$(NC)"
	./scripts/push-images.sh $(ENV)

# =============================================================================
# Deployment
# =============================================================================

deploy: ## Deploy to specified environment (default: staging)
	@echo "$(BLUE)Deploying to $(ENV)...$(NC)"
	./scripts/deploy.sh $(ENV)

deploy-staging: ## Deploy to staging
	@echo "$(BLUE)Deploying to staging...$(NC)"
	./scripts/deploy.sh staging

deploy-production: ## Deploy to production
	@echo "$(RED)Deploying to PRODUCTION...$(NC)"
	./scripts/deploy.sh production

deploy-verify: ## Verify deployment
	@echo "$(BLUE)Verifying deployment...$(NC)"
	./scripts/verify-deployment.sh $(ENV)

deploy-rollback: ## Rollback deployment
	@echo "$(YELLOW)Rolling back deployment...$(NC)"
	./scripts/deploy.sh $(ENV) --rollback

# =============================================================================
# Infrastructure
# =============================================================================

infra-plan: ## Plan infrastructure changes
	@echo "$(BLUE)Planning infrastructure...$(NC)"
	cd infrastructure/terraform/$(ENV) && terraform plan

infra-apply: ## Apply infrastructure changes
	@echo "$(BLUE)Applying infrastructure...$(NC)"
	cd infrastructure/terraform/$(ENV) && terraform apply

k8s-status: ## Show Kubernetes status
	@echo "$(BLUE)Kubernetes Status:$(NC)"
	kubectl get pods -n creatorbridge-$(ENV)
	@echo ""
	kubectl get services -n creatorbridge-$(ENV)

k8s-logs: ## View Kubernetes logs (requires SERVICE env var)
	kubectl logs -f deployment/$(SERVICE) -n creatorbridge-$(ENV)

k8s-shell: ## Open shell in pod (requires SERVICE env var)
	kubectl exec -it deployment/$(SERVICE) -n creatorbridge-$(ENV) -- /bin/sh

# =============================================================================
# Utilities
# =============================================================================

health-check: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@for service in auth user billing campaign creator content asset rights payout notification analytics; do \
		response=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/$$service/health 2>/dev/null || echo "000"); \
		if [ "$$response" = "200" ]; then \
			echo "  $(GREEN)✓$(NC) $$service-service: healthy"; \
		else \
			echo "  $(RED)✗$(NC) $$service-service: unhealthy ($$response)"; \
		fi; \
	done

load-test: ## Run load tests
	@echo "$(BLUE)Running load tests...$(NC)"
	k6 run tests/load/k6-config.js

benchmark: ## Run performance benchmarks
	@echo "$(BLUE)Running benchmarks...$(NC)"
	pnpm benchmark

docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	pnpm docs:generate

docs-serve: ## Serve documentation locally
	@echo "$(BLUE)Serving documentation...$(NC)"
	pnpm docs:serve

changelog: ## Generate changelog
	@echo "$(BLUE)Generating changelog...$(NC)"
	pnpm changelog

version: ## Show version information
	@echo "$(BLUE)CreatorBridge Platform$(NC)"
	@echo "  Node.js: $$(node --version)"
	@echo "  pnpm: $$(pnpm --version)"
	@echo "  TypeScript: $$(npx tsc --version 2>/dev/null || echo 'not installed')"
	@echo "  Docker: $$(docker --version 2>/dev/null || echo 'not installed')"
	@echo "  kubectl: $$(kubectl version --client --short 2>/dev/null || echo 'not installed')"

env-check: ## Validate environment configuration
	@echo "$(BLUE)Checking environment configuration...$(NC)"
	@if [ -f .env ]; then \
		echo "  $(GREEN)✓$(NC) .env file exists"; \
	else \
		echo "  $(RED)✗$(NC) .env file missing (copy from config/env.example)"; \
	fi
	@if [ -n "$$DATABASE_URL" ]; then \
		echo "  $(GREEN)✓$(NC) DATABASE_URL is set"; \
	else \
		echo "  $(YELLOW)!$(NC) DATABASE_URL is not set"; \
	fi
	@if [ -n "$$REDIS_URL" ]; then \
		echo "  $(GREEN)✓$(NC) REDIS_URL is set"; \
	else \
		echo "  $(YELLOW)!$(NC) REDIS_URL is not set"; \
	fi

setup: install db-start db-generate db-migrate db-seed ## Complete setup for new developers
	@echo ""
	@echo "$(GREEN)Setup complete!$(NC)"
	@echo "Run 'make dev' to start the development environment."
