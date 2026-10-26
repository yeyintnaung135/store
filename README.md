Frontend — Next.js

- Context API + useReducer — Global authentication and cart state management.
- Server Actions — Handle server-side operations and form submissions.
- Component-Based Architecture — Build reusable UI components.
- Centralized API Layer — Manage backend API requests in one place.
- JWT Authentication — Manage access tokens and authenticated API requests.
- Separation of Concerns — Separate UI, state management, and API logic.

Backend — NestJS

- Modular Architecture — Organize Auth, Products, Orders, and Export modules.
- Controller-Service Pattern — Separate HTTP handling from business logic.
- Dependency Injection (DI) — Manage service dependencies through NestJS.
- Guard Pattern (JWT + RBAC) — Protect routes using authentication and role-based authorization.
- DTO + Validation — Validate incoming API requests.
- Producer-Consumer Pattern — Process Excel exports asynchronously with BullMQ and Redis.
- Prisma ORM — Manage type-safe database queries and transactions.
- Background Job Processing — Generate Excel files without blocking API requests.
- cacheing
