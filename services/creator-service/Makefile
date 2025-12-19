.PHONY: help install dev build start test lint format clean docker-build docker-up docker-down prisma-generate prisma-migrate prisma-studio

# Default target
help:
	@echo "Available commands:"
	@echo "  make install         - Install dependencies"
	@echo "  make dev            - Run in development mode"
	@echo "  make build          - Build for production"
	@echo "  make start          - Start production server"
	@echo "  make test           - Run tests"
	@echo "  make lint           - Run linter"
	@echo "  make format         - Format code"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make docker-build   - Build Docker image"
	@echo "  make docker-up      - Start Docker containers"
	@echo "  make docker-down    - Stop Docker containers"
	@echo "  make prisma-generate - Generate Prisma client"
	@echo "  make prisma-migrate  - Run database migrations"
	@echo "  make prisma-studio   - Open Prisma Studio"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm start

test:
	npm test

lint:
	npm run lint

format:
	npm run format

clean:
	rm -rf dist node_modules coverage

docker-build:
	docker build -t nexus-creator-service .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f creator-service

prisma-generate:
	npm run prisma:generate

prisma-migrate:
	npm run prisma:migrate

prisma-studio:
	npm run prisma:studio

# Development setup
setup: install prisma-generate
	@echo "Setup complete! Run 'make dev' to start development server"

# Production build
production: clean install build
	@echo "Production build complete!"
