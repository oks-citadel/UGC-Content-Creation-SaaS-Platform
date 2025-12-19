# =============================================================================
# NEXUS Platform - Docker Makefile
# =============================================================================
# Convenient commands for managing Docker development environment
# =============================================================================

.PHONY: help up down restart logs clean build rebuild status shell db-init db-seed test

# Docker Compose files
COMPOSE_DEV := docker-compose.yml
COMPOSE_TEST := docker-compose.test.yml

# Default target
.DEFAULT_GOAL := help

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------

help: ## Show this help message
	@echo "NEXUS Platform - Docker Commands"
	@echo "================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make up              # Start all services"
	@echo "  make logs            # View all logs"
	@echo "  make logs-api        # View API Gateway logs"
	@echo "  make shell-api       # Shell into API Gateway"
	@echo "  make rebuild-api     # Rebuild and restart API Gateway"

# -----------------------------------------------------------------------------
# Main Commands
# -----------------------------------------------------------------------------

up: ## Start all services in detached mode
	docker-compose -f $(COMPOSE_DEV) up -d

down: ## Stop all services
	docker-compose -f $(COMPOSE_DEV) down

restart: ## Restart all services
	docker-compose -f $(COMPOSE_DEV) restart

stop: ## Stop services without removing containers
	docker-compose -f $(COMPOSE_DEV) stop

start: ## Start stopped services
	docker-compose -f $(COMPOSE_DEV) start

# -----------------------------------------------------------------------------
# Logs
# -----------------------------------------------------------------------------

logs: ## View logs for all services
	docker-compose -f $(COMPOSE_DEV) logs -f

logs-api: ## View API Gateway logs
	docker-compose -f $(COMPOSE_DEV) logs -f api-gateway

logs-auth: ## View Auth Service logs
	docker-compose -f $(COMPOSE_DEV) logs -f auth-service

logs-user: ## View User Service logs
	docker-compose -f $(COMPOSE_DEV) logs -f user-service

logs-content: ## View Content Service logs
	docker-compose -f $(COMPOSE_DEV) logs -f content-service

logs-web: ## View Web App logs
	docker-compose -f $(COMPOSE_DEV) logs -f web

logs-postgres: ## View PostgreSQL logs
	docker-compose -f $(COMPOSE_DEV) logs -f postgres

logs-redis: ## View Redis logs
	docker-compose -f $(COMPOSE_DEV) logs -f redis

# -----------------------------------------------------------------------------
# Build & Rebuild
# -----------------------------------------------------------------------------

build: ## Build all service images
	docker-compose -f $(COMPOSE_DEV) build

build-api: ## Build API Gateway image
	docker-compose -f $(COMPOSE_DEV) build api-gateway

build-services: ## Build all backend service images
	docker-compose -f $(COMPOSE_DEV) build api-gateway auth-service user-service content-service campaign-service creator-service billing-service analytics-service commerce-service marketplace-service

build-workers: ## Build all worker images
	docker-compose -f $(COMPOSE_DEV) build video-processor social-publisher notification-dispatcher analytics-aggregator

build-apps: ## Build all frontend app images
	docker-compose -f $(COMPOSE_DEV) build web brand-portal creator-portal admin

rebuild: down build up ## Rebuild and restart all services

rebuild-api: ## Rebuild and restart API Gateway
	docker-compose -f $(COMPOSE_DEV) up -d --build api-gateway

rebuild-web: ## Rebuild and restart Web App
	docker-compose -f $(COMPOSE_DEV) up -d --build web

# -----------------------------------------------------------------------------
# Status & Inspection
# -----------------------------------------------------------------------------

status: ## Show status of all services
	docker-compose -f $(COMPOSE_DEV) ps

ps: status ## Alias for status

stats: ## Show resource usage statistics
	docker stats

top: ## Show running processes in containers
	docker-compose -f $(COMPOSE_DEV) top

# -----------------------------------------------------------------------------
# Shell Access
# -----------------------------------------------------------------------------

shell-api: ## Open shell in API Gateway container
	docker-compose -f $(COMPOSE_DEV) exec api-gateway sh

shell-auth: ## Open shell in Auth Service container
	docker-compose -f $(COMPOSE_DEV) exec auth-service sh

shell-web: ## Open shell in Web App container
	docker-compose -f $(COMPOSE_DEV) exec web sh

shell-postgres: ## Open PostgreSQL shell
	docker-compose -f $(COMPOSE_DEV) exec postgres psql -U postgres -d nexus_dev

shell-mongo: ## Open MongoDB shell
	docker-compose -f $(COMPOSE_DEV) exec mongodb mongosh -u mongo -p mongo nexus_dev

shell-redis: ## Open Redis CLI
	docker-compose -f $(COMPOSE_DEV) exec redis redis-cli

# -----------------------------------------------------------------------------
# Database Operations
# -----------------------------------------------------------------------------

db-init: ## Initialize databases
	docker-compose -f $(COMPOSE_DEV) exec postgres /docker-entrypoint-initdb.d/init-db.sh

db-seed: ## Seed test data
	docker-compose -f $(COMPOSE_DEV) exec -T postgres bash < scripts/seed-data.sh

db-migrate: ## Run database migrations
	docker-compose -f $(COMPOSE_DEV) exec api-gateway pnpm db:migrate

db-reset: ## Reset database (WARNING: deletes all data)
	docker-compose -f $(COMPOSE_DEV) down -v postgres
	docker-compose -f $(COMPOSE_DEV) up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5
	$(MAKE) db-init

# -----------------------------------------------------------------------------
# Infrastructure Services
# -----------------------------------------------------------------------------

up-infra: ## Start only infrastructure services (databases, cache, etc.)
	docker-compose -f $(COMPOSE_DEV) up -d postgres mongodb redis elasticsearch minio mailhog

down-infra: ## Stop infrastructure services
	docker-compose -f $(COMPOSE_DEV) stop postgres mongodb redis elasticsearch minio mailhog

restart-postgres: ## Restart PostgreSQL
	docker-compose -f $(COMPOSE_DEV) restart postgres

restart-redis: ## Restart Redis
	docker-compose -f $(COMPOSE_DEV) restart redis

restart-mongo: ## Restart MongoDB
	docker-compose -f $(COMPOSE_DEV) restart mongodb

# -----------------------------------------------------------------------------
# Testing
# -----------------------------------------------------------------------------

test-up: ## Start test environment
	docker-compose -f $(COMPOSE_TEST) up -d

test-down: ## Stop test environment
	docker-compose -f $(COMPOSE_TEST) down -v

test-run: ## Run unit tests
	docker-compose -f $(COMPOSE_TEST) run test-runner

test-integration: ## Run integration tests
	docker-compose -f $(COMPOSE_TEST) run integration-test-runner

test-e2e: ## Run E2E tests
	docker-compose -f $(COMPOSE_TEST) run e2e-test-runner

test-all: test-up test-run test-integration test-e2e test-down ## Run all tests

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------

clean: ## Stop and remove containers, networks
	docker-compose -f $(COMPOSE_DEV) down

clean-volumes: ## Stop and remove containers, networks, volumes (WARNING: deletes all data)
	docker-compose -f $(COMPOSE_DEV) down -v

clean-images: ## Remove all built images
	docker-compose -f $(COMPOSE_DEV) down --rmi all

clean-all: ## Remove everything (containers, volumes, images, networks)
	docker-compose -f $(COMPOSE_DEV) down -v --rmi all
	docker system prune -f

# -----------------------------------------------------------------------------
# Development Helpers
# -----------------------------------------------------------------------------

install: ## Install dependencies in all services
	docker-compose -f $(COMPOSE_DEV) exec api-gateway pnpm install
	docker-compose -f $(COMPOSE_DEV) exec web pnpm install

format: ## Format code
	docker-compose -f $(COMPOSE_DEV) exec api-gateway pnpm format

lint: ## Run linter
	docker-compose -f $(COMPOSE_DEV) exec api-gateway pnpm lint

type-check: ## Run type checking
	docker-compose -f $(COMPOSE_DEV) exec api-gateway pnpm type-check

# -----------------------------------------------------------------------------
# Service-specific Commands
# -----------------------------------------------------------------------------

api-restart: ## Restart API Gateway
	docker-compose -f $(COMPOSE_DEV) restart api-gateway

web-restart: ## Restart Web App
	docker-compose -f $(COMPOSE_DEV) restart web

workers-restart: ## Restart all workers
	docker-compose -f $(COMPOSE_DEV) restart video-processor social-publisher notification-dispatcher analytics-aggregator

services-restart: ## Restart all backend services
	docker-compose -f $(COMPOSE_DEV) restart api-gateway auth-service user-service content-service campaign-service creator-service billing-service analytics-service commerce-service marketplace-service

# -----------------------------------------------------------------------------
# Monitoring & Debugging
# -----------------------------------------------------------------------------

health: ## Check health of all services
	@echo "Checking service health..."
	@docker-compose -f $(COMPOSE_DEV) ps | grep healthy || echo "Some services are unhealthy"

inspect-api: ## Inspect API Gateway container
	docker inspect nexus-api-gateway

inspect-web: ## Inspect Web App container
	docker inspect nexus-web

network-ls: ## List Docker networks
	docker network ls | grep nexus

volume-ls: ## List Docker volumes
	docker volume ls | grep nexus

# -----------------------------------------------------------------------------
# Quick Development Workflows
# -----------------------------------------------------------------------------

dev: up-infra db-init ## Start infrastructure and initialize databases
	@echo "Infrastructure ready! Start your services with 'make up' or run them locally."

fresh: clean-volumes up db-init db-seed ## Fresh start with clean data
	@echo "Fresh environment ready with seed data!"

quick: up logs ## Quick start and show logs

backend: up-infra services-restart workers-restart ## Start backend services
	@echo "Backend services started!"

frontend: ## Start frontend apps
	docker-compose -f $(COMPOSE_DEV) up -d web brand-portal creator-portal admin
	@echo "Frontend apps started!"
