# Universal Flower Shop Platform

Professional monorepo foundation for a multi-shop CRM and Telegram Shop platform.

## Architecture

This repository uses Turborepo with npm workspaces. All client applications talk to the central API. Applications must not import internal files from other applications.

```text
web ----------\
bot -----------\
telegram-shop --- api --- PostgreSQL / Prisma
desktop -------/
mobile -------/
```

Dependency rule:

```text
apps -> packages
packages -/> apps
apps -/> apps
```

## Apps

- `apps/web`: CRM Admin Panel for shop staff.
- `apps/api`: NestJS backend, auth, RBAC, tenant isolation, Prisma, and platform APIs.
- `apps/bot`: Telegram bot runtime. It uses the API and does not access the database directly.
- `apps/telegram-shop`: Future Telegram Mini App placeholder.
- `apps/desktop`: Future Tauri Windows app placeholder.
- `apps/mobile`: Future Expo mobile app placeholder.

## Packages

- `packages/types`: Shared TypeScript types.
- `packages/validation`: Shared Zod schemas.
- `packages/domain`: Pure business logic without UI or database code.
- `packages/permissions`: Role and permission constants.
- `packages/api-client`: Shared API client for frontends and bot.
- `packages/ui`: Shared React UI components for web-based apps.
- `packages/config`: Shared tooling and environment helpers.

## Getting Started

```bash
npm install
npm run dev
```

Run one app:

```bash
npm run dev:web
npm run dev:api
npm run dev:bot
```

## Environment

Each app has its own `.env.example`. Real `.env` files are ignored by git.

## Development Rules

- Database access belongs only to `apps/api`.
- Web, bot, Telegram Shop, desktop, and mobile communicate through the API.
- Tenant-specific business data must be scoped by `shopId`.
- Platform endpoints live under `/platform/*` and are separate from shop user endpoints.
- Shared logic belongs in `packages/*`.
- Source code names must be in English.
