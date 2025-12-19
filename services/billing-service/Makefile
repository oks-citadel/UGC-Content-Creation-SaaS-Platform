.PHONY: help install dev build start test lint clean docker-build docker-up docker-down prisma-generate prisma-migrate prisma-seed prisma-studio

help:
	@echo "Available commands:"
	@echo "  make install         - Install dependencies"
	@echo "  make dev             - Run development server"
	@echo "  make build           - Build for production"
	@echo "  make start           - Start production server"
	@echo "  make test            - Run tests"
	@echo "  make lint            - Run linter"
	@echo "  make clean           - Clean build files"
	@echo "  make docker-build    - Build Docker image"
	@echo "  make docker-up       - Start Docker containers"
	@echo "  make docker-down     - Stop Docker containers"
	@echo "  make prisma-generate - Generate Prisma client"
	@echo "  make prisma-migrate  - Run database migrations"
	@echo "  make prisma-seed     - Seed database with plans"
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

clean:
	rm -rf dist node_modules coverage

docker-build:
	docker build -t nexus-billing-service .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

prisma-generate:
	npx prisma generate

prisma-migrate:
	npx prisma migrate dev

prisma-seed:
	npx prisma db seed

prisma-studio:
	npx prisma studio
