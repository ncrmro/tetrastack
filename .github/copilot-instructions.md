# Copilot Instructions

> **For full context**: See `CLAUDE.md` in the project root
>
> **IMPORTANT**: When making changes to this file or the Copilot workflow, update the conventions documentation: `docs/conventions/copilot-agent.md`

## GitHub Copilot Environment

**IMPORTANT**: In the GitHub Copilot environment, `make up` has NOT been run. The environment has been verified during setup, but services are not currently running.

All `make` commands are Docker-based and will automatically start required services:

- Commands like `make lint`, `make format`, `make test-unit` use `--no-deps` (fast, no service startup)
- Commands like `make test-integration`, `make e2e` automatically start dependent services (db, web, etc.)

## Quick Start

```bash
# Start dev server (recommended - starts all services)
make up

# Stop services
make down

# Run tests (automatically starts required services)
make test-unit         # Fast - no service dependencies
make test-integration  # Starts db service
make e2e               # Starts all services including web

# Lint and format (no service dependencies)
make lint
make format
```

Dev server: `localhost:3000` (ports in `.env`)
Dev credentials: password `admin` (admin) or `password` (user)

## Architecture Overview

```
src/
├── actions/README.md          # Actions layer (auth + React boundary)
├── models/README.md           # Models layer (DB ops + business logic)
├── agents/README.md           # AI agent patterns (database-first)
├── lib/db/README.md           # Database schemas & migrations
└── app/
    └── globals.css            # Theme system (consult for all styling!)

tests/
├── README.md                   # Testing architecture overview
├── factories/README.md         # Factory pattern (reduces test code 87%)
└── e2e/README.md              # E2E patterns & fixtures
```

## Architecture Navigation

**Always consult the relevant README before writing code:**

- **React components?** → Read `src/actions/README.md` (always use actions layer as boundary)
- **Database operations?** → Read `src/models/README.md` (prefer bulk operations) and `src/lib/db/README.md` (schemas)
- **Writing tests?** → Read `tests/factories/README.md` (ALWAYS use factories with minimal custom parameters)
- **AI agents?** → Read `src/agents/README.md` (database-first generation pattern)
- **E2E tests?** → Read `tests/e2e/README.md` (fixtures & page objects)
- **Styling?** → Read `src/app/globals.css` (Material Design-inspired theme system)

## Critical Conventions

- **NextJS**: Prefer server components over client components
- **Actions over API routes**: Use `src/actions/` unless specifically needed
- **No redirects in actions**: Return success/error objects, handle navigation in components
- **Always use factories in tests with minimal custom parameters**: See `tests/factories/README.md`
  - ✅ Good: `foodFactory.create()` or `foodFactory.processed().fat().create()`
  - ⚠️ Use sparingly: `foodFactory.create({ name: 'Specific Name' })`
  - ❌ Avoid: Multiple custom parameters that override defaults
- **TypeScript**: Avoid `any` type, never use dynamic imports
- **Database migrations**: Use `make migration-reconcile` to resolve conflicts

## PR Title Conventions

When working on changes related to specifications in the `./specs` directory:

- **Format**: `feat(SPEC_NAME): description`
- **Example**: `feat(003-meal-pre-task-graph): add task dependency graph`
- **Pattern**: Use the spec directory name (e.g., `001-nutrition-scaling`, `002-ai-meal-form`) as the scope

## Spec Task Updates

**IMPORTANT**: When working on a specification from the `./specs` directory:

- **Always update the corresponding `tasks.md` file** to mark tasks as complete
- Check off tasks with `- [x]` and add status emoji (e.g., `✅`)
- Update the status section if completing major milestones
- This keeps spec progress tracking accurate and up-to-date

## Code Formatting & Testing

All commands use Docker and automatically manage service dependencies:

```bash
# Formatting (no service dependencies)
make format              # Auto-format with Biome
make lint                # Run Biome linter and typecheck

# Testing (Docker-based)
make test-unit           # Unit tests (no service dependencies)
make test-integration    # Integration tests (starts db)
make test-components     # Component tests (no service dependencies)
make test-agents         # Agent tests (starts db)
make e2e                 # E2E tests (starts all services)
make test-all            # Runs unit, integration, component, and e2e tests (does not include agent tests)

# CI pipeline
make ci                  # Runs lint + unit + integration + e2e tests
```

**Note**: Pre-commit hooks auto-format with Biome. Typecheck requires manual `make format`.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + TailwindCSS
- **Backend**: Next.js actions + Drizzle ORM + SQLite (Turso in prod)
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
