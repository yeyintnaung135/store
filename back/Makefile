
.DEFAULT_GOAL := dev

SHELL := cmd.exe
.SHELLFLAGS := /C

.PHONY: migrate seed dbstudio dbgenerate generate-module dev dev-build dev-logs dev-down prod prod-build prod-logs prod-down

# ==========================
# Database
# ==========================

migrate:
	npm run prisma:migrate

seed:
	npm run prisma:seed

dbstudio:
	npx prisma studio

dbgenerate:
	npx prisma generate

# ==========================
# NestJS Generator
# Usage: make generate-module name=admin/orders
# ==========================

generate-module:
	@if not "$(name)"=="" (npx nest generate module $(name) --no-spec && npx nest generate controller $(name) --no-spec && npx nest generate service $(name) --no-spec) else (echo Usage: make generate-module name=admin/orders & exit /b 1)

# ==========================
# Development
# ==========================

dev:
	npm run start:dev

dev-build:
	npm run build

redis-test:
	docker compose -f docker-compose.dev.yml exec redis redis-cli ping

docker-dev-build:
	docker compose -f docker-compose.dev.yml up -d --build

docker-dev-down:
	docker compose -f docker-compose.dev.yml down

docker-dev-start:
	docker compose -f docker-compose.dev.yml start

docker-dev-stop:
	docker compose -f docker-compose.dev.yml stop

docker-dev-restart:
	docker compose -f docker-compose.dev.yml restart

docker-dev-logs:
	docker compose -f docker-compose.dev.yml logs -f api
	
dev-logs:
	docker compose -f docker-compose.dev.yml logs -f api

dev-down:
	docker compose -f docker-compose.dev.yml down

# ==========================
# Production
# ==========================

prod:
	docker compose -f docker-compose.prod.yml up -d

prod-build:
	docker compose -f docker-compose.prod.yml up -d --build

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f api

prod-down:
	docker compose -f docker-compose.prod.yml down