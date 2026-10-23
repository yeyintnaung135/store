.PHONY: help clean \
	front-dev front-build front-start front-lint front-lint-fix \
	front-format front-format-check front-test front-test-watch front-test-e2e \
	back-build back-deploy back-format back-format-check \
	back-start back-start-dev back-start-debug back-start-prod \
	back-lint back-lint-fix \
	back-prisma-generate back-prisma-migrate back-prisma-deploy back-prisma-studio back-db-test-prepare back-db-seed \
	back-generate \
	back-test back-test-watch back-test-cov back-test-debug back-test-integration back-test-e2e \
	back-docker-up back-docker-down

help:
	@echo Front
	@echo   make front-dev            next dev
	@echo   make front-build          next build
	@echo   make front-start          next start
	@echo   make front-lint           eslint
	@echo   make front-lint-fix       eslint --fix
	@echo   make front-format         prettier --write
	@echo   make front-format-check   prettier --check
	@echo   make front-test           jest
	@echo   make front-test-watch     jest --watch
	@echo   make front-test-e2e       playwright
	@echo Back
	@echo   make back-build             nest build
	@echo   make back-deploy            nest deploy
	@echo   make back-start             nest start
	@echo   make back-start-dev         nest start --watch
	@echo   make back-start-debug       nest start --debug --watch
	@echo   make back-start-prod        node dist/main.js
	@echo   make back-lint              oxlint
	@echo   make back-lint-fix          oxlint --fix
	@echo   make back-format            prettier --write
	@echo   make back-format-check      prettier --check
	@echo   make back-prisma-generate   prisma generate
	@echo   make back-prisma-migrate    prisma migrate dev
	@echo   make back-prisma-deploy     prisma migrate deploy
	@echo   make back-prisma-studio     npx prisma studio
	@echo   make back-db-test-prepare   create and migrate store_test
	@echo   make back-db-seed           prisma db seed on store
	@echo   make back-generate name=orders  nest module, controller, and service
	@echo   make back-test              vitest unit tests
	@echo   make back-test-watch        vitest watch
	@echo   make back-test-cov          vitest coverage
	@echo   make back-test-debug        vitest debug
	@echo   make back-test-integration  integration tests
	@echo   make back-test-e2e          end-to-end tests
	@echo   make back-docker-up         docker compose up --build
	@echo   make back-docker-down       docker compose down
	@echo   make clean                  remove generated build output

front-dev:
	npm --prefix front run dev

front-build:
	npm --prefix front run build

front-start:
	npm --prefix front run start

front-lint:
	npm --prefix front run lint

front-lint-fix:
	npm --prefix front run lint:fix

front-format:
	npm --prefix front run format

front-format-check:
	npm --prefix front run format:check

front-test:
	npm --prefix front test

front-test-watch:
	npm --prefix front run test:watch

front-test-e2e:
	npm --prefix front run test:e2e

back-build:
	npm --prefix back run build

back-deploy:
	npm --prefix back run deploy

back-start:
	npm --prefix back run start

back-start-dev:
	npm --prefix back run start:dev

back-start-debug:
	npm --prefix back run start:debug

back-start-prod:
	npm --prefix back run start:prod

back-lint:
	npm --prefix back run lint

back-lint-fix:
	npm --prefix back run lint:fix

back-format:
	npm --prefix back run format

back-format-check:
	npm --prefix back run format:check

back-prisma-generate:
	npm --prefix back run prisma:generate

back-prisma-migrate:
	npm --prefix back run prisma:migrate

back-prisma-deploy:
	npm --prefix back run prisma:deploy

back-prisma-studio:
	cd back && npx prisma studio

back-db-test-prepare:
	npm --prefix back run db:test:prepare

back-db-seed:
	npm --prefix back exec prisma db seed

back-generate:
	cd back && npx nest generate module $(name) --no-spec && npx nest generate controller $(name) --no-spec --crud false && npx nest generate service $(name) --no-spec

back-test:
	npm --prefix back test

back-test-watch:
	npm --prefix back run test:watch

back-test-cov:
	npm --prefix back run test:cov

back-test-debug:
	npm --prefix back run test:debug

back-test-integration:
	npm --prefix back run test:integration

back-test-e2e:
	npm --prefix back run test:e2e

back-docker-up:
	docker compose --project-directory back up --build

back-docker-down:
	docker compose --project-directory back down

clean:
	node --input-type=module -e "import { rmSync, readdirSync } from 'node:fs'; import path from 'node:path'; const targets = ['back/dist','back/coverage','back/src/generated/prisma','front/.next','front/out','front/test-results','front/playwright-report','front/blob-report']; for (const target of targets) rmSync(target, { recursive: true, force: true }); const walk = (dir) => { let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; } for (const entry of entries) { if (entry.name === 'node_modules' || entry.name === '.git') continue; const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (entry.name.endsWith('.tsbuildinfo')) rmSync(full, { force: true }); } }; walk('back'); walk('front'); console.log('Cleaned build output');"
