.PHONY: dev dev-build dev-logs dev-down prod prod-build prod-logs prod-down

# Development
migrate:
	npm run prisma:migrate

seed:
	npm run prisma:seed

dbstudio:
	npx prisma studio

dev:
	npm run start:dev

dev-build:
	npm run build

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f api

dev-down:
	docker compose -f docker-compose.dev.yml down

# Production
prod:
	docker compose -f docker-compose.prod.yml up -d

prod-build:
	docker compose -f docker-compose.prod.yml up -d --build

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f api

prod-down:
	docker compose -f docker-compose.prod.yml down
