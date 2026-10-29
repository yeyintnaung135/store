# storeback

NestJS API for the store.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`. The app listens on `PORT` or `3000`, and Prisma reads `DATABASE_URL`.

Start PostgreSQL:

```bash
docker compose up -d postgres
npm run prisma:migrate
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

## Lint and format

Linting uses [Oxlint](https://oxc.rs/docs/guide/usage/linter) with type-aware rules. Formatting uses Prettier.

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Tests

| Script | What it covers |
| --- | --- |
| `npm test` | Same as `npm run test:e2e` |
| `npm run test:integration` | In-process HTTP tests through `AppModule` against the `store_test` database |
| `npm run test:e2e` | Builds the app, starts `dist/main.js`, and calls the live server using `store_test` |

## Docker

PostgreSQL 17 and the API:

```bash
docker compose up --build
```

The database is published on port `5432` (`store` / `store`, database `store`). The API listens on port `3000`. On startup it runs `prisma migrate deploy`. `GET /health` runs `SELECT 1`.

Tests use a separate database, `store_test`, from `.env.test`. `npm run test:integration` and `npm run test:e2e` create it if needed and apply migrations. A new Postgres volume also creates it from `docker/postgres/init`.

Swagger UI is at `/docs`. The OpenAPI document is at `/docs-json`.

Prisma Client is generated TypeScript in `src/generated/prisma` (not committed). `npm run build` and `npm run test:e2e` generate it. After schema changes, run `npm run prisma:migrate`.

## CI

`.github/workflows/back.yml` installs dependencies, lints, checks formatting, then runs the end-to-end tests. That job provides Postgres (`store_test`) and Redis. `npm run test:e2e` builds the API, applies migrations, and calls the live server. A second job builds the Docker image.
