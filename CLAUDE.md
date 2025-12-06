# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a next-forge project - a production-grade Turborepo template for Next.js apps designed for building SaaS applications. The monorepo contains multiple apps and shared packages that work together.

Built on next-forge's core principles: Fast, Cheap, Opinionated, Modern, and Safe.

## Repository Structure

### Apps (apps/)
- **app** (port 3000) - Main application with authentication and database integration
- **api** (port 3002) - RESTful API with health checks, webhooks, and Strava integration
- **web** (port 3001) - Marketing website
- **docs** - Documentation site (Mintlify)
- **email** - Email templates with React Email
- **storybook** - Component development environment
- **studio** - Database studio

### Packages (packages/)
Shared packages used across apps:
- **auth** - Clerk-based authentication
- **database** - Prisma ORM with PostgreSQL (Neon serverless adapter)
- **design-system** - Component library with dark mode
- **payments** - Stripe integration
- **analytics** - Google Analytics and Posthog
- **observability** - Sentry error tracking and logging
- **security** - Arcjet application security and rate limiting
- **email** - Resend transactional emails
- **cms** - Type-safe content management
- **seo** - Metadata, sitemaps, JSON-LD
- **ai** - AI integration utilities
- **webhooks** - Webhook handling
- **collaboration** - Real-time features (Liveblocks)
- **feature-flags** - Feature flag management
- **storage** - File upload and management
- **internationalization** - Multi-language support
- **notifications** - In-app notifications

## Common Commands

### Development
```bash
# Run all apps in development mode
pnpm dev

# Run specific apps (API and main app only)
pnpm dev:tools

# Run individual apps
cd apps/app && pnpm dev    # Main app on port 3000
cd apps/api && pnpm dev    # API on port 3002
cd apps/web && pnpm dev    # Web on port 3001
```

### Building and Testing
```bash
# Build all apps and packages
pnpm build

# Run tests across all packages
pnpm test

# Run tests in a specific app/package
cd apps/app && pnpm test

# Type checking
pnpm typecheck
```

### Linting and Formatting
```bash
# Check code quality with Ultracite (Biome-based)
pnpm check

# Fix code quality issues
pnpm fix
```

### Database
```bash
# Format schema, generate client, and push to database
pnpm migrate

# Or run Prisma commands directly
cd packages/database
npx prisma format
npx prisma generate
npx prisma db push
npx prisma studio  # Open database GUI
```

### Stripe (for local webhook testing)
```bash
# In the API app, this runs automatically with dev command
cd apps/api
stripe listen --forward-to localhost:3002/webhooks/payments
```

### Maintenance
```bash
# Update dependencies (excluding recharts)
pnpm bump-deps

# Update shadcn/ui components
pnpm bump-ui

# Clean node_modules
pnpm clean
```

## Architecture Patterns

### Monorepo Organization
- Uses Turborepo for build orchestration and caching
- Package manager: pnpm with workspace protocol
- Shared TypeScript config in `packages/typescript-config`
- Apps import packages using workspace protocol (`@repo/package-name`)

### Environment Variables
- Each app/package has its own `.env.example`
- Environment validation using `@t3-oss/env-nextjs` in `env.ts` files
- Apps compose environment configs by extending package keys (see `apps/api/env.ts`)
- Pattern: Each package exports its `keys` which apps extend in their `createEnv` calls

### Authentication Flow
- Clerk handles authentication in the `@repo/auth` package
- App routes split into `(authenticated)` and `(unauthenticated)` route groups
- Middleware handles auth protection (see `apps/app/middleware.ts` and `apps/api/middleware.ts`)

### Database Schema
- Prisma with PostgreSQL (Neon serverless)
- Generated client output: `packages/database/generated`
- Custom models include Strava integration (StravaConnection, StravaActivity)
- Uses relation mode: "prisma" for compatibility

### API Structure
- Next.js App Router with route handlers in `apps/api/app`
- API routes organized by feature:
  - `/health` - Health check endpoint
  - `/strava/*` - Strava OAuth and activity sync
  - `/webhooks/payments` - Stripe webhooks
  - `/webhooks/auth` - Clerk webhooks
  - `/cron/*` - Scheduled jobs
- Concurrent dev server runs Next.js and Stripe CLI webhook listener

### Frontend Organization
- Main app uses Next.js App Router with route groups
- `(authenticated)` routes require login (e.g., `/workouts`)
- `(unauthenticated)` routes like sign-in/sign-up
- Components colocated with routes in feature folders
- Shared UI in `packages/design-system`

### Code Quality
- Biome for linting/formatting via Ultracite presets
- Extends: `ultracite/core`, `ultracite/react`, `ultracite/next`
- Certain generated paths excluded (see `biome.jsonc`)
- Global: Liveblocks types available

### Testing
- Vitest for unit tests
- Tests in `__tests__` directories
- Testing Library for React components
- jsdom environment for app testing

## Key Integration Points

### Strava Integration
- OAuth flow: `/strava/connect` → `/strava/callback`
- Connection stored in StravaConnection model (single row, id=1)
- Activities synced to StravaActivity model
- Sync endpoint: `/strava/sync`
- Activity export: `/strava/activities/export`

### Webhooks
- Stripe: Handled in `/webhooks/payments`
- Clerk: Handled in `/webhooks/auth`
- Uses Svix for Clerk webhook verification

### Observability
- Sentry for error tracking (configured via instrumentation files)
- Separate edge and server configs
- Analytics via Google Analytics and Posthog

## Development Workflow

1. Clone and install dependencies: `pnpm install`
2. Set up environment variables (copy `.env.example` files)
3. Configure required services (Clerk, Stripe, database)
4. Run database migrations: `pnpm migrate`
5. Start development: `pnpm dev:tools` (or `pnpm dev` for all apps)
6. For Stripe webhooks, ensure Stripe CLI is running

## Important Notes

- Node.js 20+ required
- Package manager: pnpm 10.19.0 (specified in package.json)
- TypeScript 5.9.3 across the monorepo
- React 19.2.0, Next.js 16.0.0
- Turbo builds depend on tests passing first
- Global env changes trigger all rebuilds (see `turbo.json`)
