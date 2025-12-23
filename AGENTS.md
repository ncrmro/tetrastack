# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Server & Commands

- **Dev server**: localhost:3000 (ports are set in dotenv file)
- **Start development**: `make up` (recommended) or `npm run db:migrate && npm run dev`
- **Stop services**: `make down`
- **Clean everything**: `make destroy`
- **Available commands**: See `@Makefile` for all available commands
- **CI pipeline**: `make ci` (runs linting + all tests)

**IMPORTANT: Running npm commands**

- All npm commands should be run inside the Docker container via `docker compose exec web npm <command>`
- Example: `docker compose exec web npm run test:unit`
- Example: `docker compose exec web npm run test:integration`
- Example: `docker compose exec web npm install <package>`
- The Makefile provides shortcuts for common commands (e.g., `make format`, `make ci`), which already handle Docker execution

**IMPORTANT: Running E2E tests**

- E2E tests must be run using the dedicated `e2e` service: `docker compose run --rm e2e` or `make e2e`
- The `e2e` service uses the official Playwright Docker image with all browser dependencies pre-installed
- Do NOT run E2E tests via `docker compose exec web npm run test:e2e` - use the `e2e` service instead

## Authentication & Development Credentials

- **Admin access**: Password "admin" with any suffix (e.g., "admin-123", "admin-943")
- **Regular user access**: Password "password" with any suffix (e.g., "password-456")
- These are development-only credentials for testing

## Testing

See `tests/AGENTS.md` for comprehensive testing documentation including:

- Three-tier testing approach (unit, integration, E2E, agents)
- Running tests and configuration
- Test frameworks (Vitest, Playwright)
- Writing tests and best practices
- **Test data factories**: See `tests/factories/AGENTS.md` for the factory pattern (fishery + faker) that reduces test code by 87%

**IMPORTANT: Factory Usage Best Practice**

Tests should **always use existing factories** with **as few custom parameters as possible**:

- ✅ **Good**: `await teamFactory.create()` - Uses all defaults
- ✅ **Good**: `await projectFactory.active().highPriority().create()` - Uses traits for variation
- ⚠️ **Use sparingly**: `await projectFactory.create({ title: 'Specific Project' })` - Only when testing requires a specific value
- ❌ **Avoid**: `await projectFactory.create({ title: 'X', status: 'Y', priority: 'Z', ... })` - Defeats the purpose of factories

**Why?** Factories provide sensible defaults and realistic test data. Overriding many parameters makes tests brittle, harder to maintain, and obscures the actual test logic. Use traits for common variations instead of custom parameters.

## MCP Servers

The project has several Model Context Protocol (MCP) servers available for enhanced development capabilities:

### TypeScript Language Server MCP

- **Purpose**: Advanced TypeScript code intelligence and refactoring
- **Tools available**:
  - `definition`: Read source code definition of symbols
  - `references`: Find all usages of a symbol throughout the codebase
  - `diagnostics`: Get type errors and warnings for files
  - `hover`: Get type information and documentation for symbols
  - `rename_symbol`: Rename symbols and update all references
  - `edit_file`: Apply multiple text edits to files
- **Usage**: Prefer these tools for TypeScript-specific operations like finding references, getting type information, or performing safe refactorings

**IMPORTANT: When working with TypeScript files, prefer TypeScript LSP tools over standard tools:**

- Use `mcp__typescript-language-server__edit_file` instead of `Edit` for editing TypeScript files - provides type-aware editing and better handling of complex refactorings
- Use `mcp__typescript-language-server__references` instead of `Grep` when finding symbol usages - understands TypeScript imports, type references, and symbol resolution
- Use `mcp__typescript-language-server__definition` instead of file search when navigating to symbol definitions - follows TypeScript's module resolution and type definitions
- Use `mcp__typescript-language-server__rename_symbol` for renaming variables/functions/types - automatically updates all references including imports
- Use `mcp__typescript-language-server__diagnostics` to check for type errors before running builds - faster feedback on type issues

The LSP tools understand TypeScript's type system, module resolution, and language features, making them more accurate and safer for refactoring operations than text-based tools.

### Docker MCP Server

- **Purpose**: Container management, service monitoring, and debugging
- **Status**: Available when Docker is running
- **Tools available**:
  - `mcp__docker__list-containers`: List all Docker containers and their status
  - `mcp__docker__get-logs`: Retrieve logs from specific containers
  - `mcp__docker__create-container`: Create new containers
  - `mcp__docker__deploy-compose`: Deploy Docker Compose stacks
- **Usage**: Use to monitor running services, debug container issues, and check application logs. Works in conjunction with Playwright MCP to verify the application is running and view its logs during development

### Playwright MCP Server

- **Purpose**: Browser automation and E2E testing assistance
- **Status**: Should be running automatically with `make up`
- **Access**: Connected to the development server on port specified by `WEB_PORT` in `.env` (always check `.env` for current port)
- **Tools available**: Browser navigation, clicking, typing, taking screenshots, evaluating JavaScript, and more
- **Usage**: Useful for debugging E2E tests, exploring UI behavior, and automated browser interactions

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 15 (App Router) with React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API routes with server actions
- **Database**: SQLite with Drizzle ORM (Turso in production)
- **Auth**: NextAuth.js v5
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Deployment**: Cloudflare Pages with OpenNext

### Core Directory Structure

**IMPORTANT**: Directories with AGENTS.md files must have those files read when working in those areas.

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/             # API routes
│   ├── [feature]/       # Feature-based page organization
│   └── globals.css      # Theme system (always consult for styling)
├── lib/
│   ├── db/              # Database schema and connection
│   │   └── AGENTS.md    # Database patterns and migration management
│   ├── admin/           # Generic admin CRUD system
│   └── [utilities]      # Business logic, calculations, utils
├── models/              # Database operations and business logic
│   └── AGENTS.md        # Models layer architecture
├── actions/             # Server actions (prefer over API routes)
│   └── AGENTS.md        # Actions layer patterns
├── agents/              # AI agents
│   └── AGENTS.md        # Agent design principles
└── components/          # Reusable components

tests/
├── AGENTS.md            # Testing architecture and guidelines
├── e2e/                 # Playwright E2E tests
│   └── AGENTS.md        # E2E testing guidelines and fixtures
├── integration/         # Integration tests
├── unit/                # Unit tests
├── agents/              # Agent integration tests
└── factories/           # Test data factories
    └── AGENTS.md        # Factory pattern documentation

specs/
├── AGENTS.md            # Specification process documentation
└── ###-feature-slug/    # Individual feature specs
```

### Active Specs

<!-- Add specs here as they are created -->
<!-- Example: - [001-user-auth](specs/001-user-auth/) - User authentication -->

### Database Architecture

- **Core entities**: users, teams, teamMemberships, projects, tasks, tags
- **Schema organization**: Domain-specific schema files in `src/database/schema.*.ts`
- **Migration management**: Use `make migration-reconcile` to resolve conflicts
- See `src/database/AGENTS.md` for detailed schema documentation and Drizzle patterns

## Business Domain (Tetrastack - Project Management Platform)

Tetrastack is a project management platform that enables teams to collaborate on projects and tasks:

### Core Concepts

- **Teams (Organizations)**: Groups of users collaborating together with role-based membership (admin/member)
- **Projects**: Work items tracked within teams with status, priority, and tags
- **Tasks**: Individual work items within projects with assignments and due dates

### Key Features

- Multi-member team collaboration
- Project tracking with status (planning, active, completed, archived) and priority levels
- Task management with assignments and deadlines
- Tagging system for organization
- Admin interface for managing teams and projects

## Development Guidelines

### Code Organization

- **Prefer server components** over client components
- **Use server actions** (`src/actions/`) over API routes unless specifically needed
- **Component organization**: Break apart components to avoid overly large files
- **Admin system**: Generic CRUD operations handled by `src/lib/admin/`
- **Avoid redirects in server actions**: Never use `redirect()` or `permanentRedirect()` in server actions as they throw errors that can confuse try/catch blocks. Return success/error objects instead and handle navigation in the client component.

### Many-First Design Pattern

**CRITICAL**: This codebase uses a "many-first" design pattern for all model CRUD operations. This is a core architectural principle that MUST be followed.

**What is Many-First?**

- All CRUD operations work with arrays by default
- Single operations use array destructuring: `const [item] = await insertItems([data])`
- This eliminates the need for duplicate `selectOne`/`selectMany`, `createOne`/`createMany` functions

**Factory Pattern**
Models use `createModelFactory` from `src/lib/models/` which generates:

```typescript
const { insert, select, update, delete, buildConditions, takeFirst } = createModelFactory(...);
```

**NEVER Create Single-Record Wrappers**
❌ **DO NOT** create functions like:

```typescript
export async function createTag(data) { ... }      // NO!
export async function updateTag(id, data) { ... }  // NO!
export async function deleteTag(id) { ... }        // NO!
```

✅ **DO** use the many-first operations directly:

```typescript
// In actions/models
const [tag] = await insertTags([data]);
const [updated] = await updateTags([eq(tags.id, id)], data);
await deleteTags([eq(tags.id, id)]);
```

**Exception**: Wrapper functions may exist ONLY for backward compatibility with existing tests or external integrations. Do not create new ones.

**Benefits**:

- Less code duplication
- Consistent API across all models
- Easier to maintain
- Type-safe with full inference

See `src/lib/models/AGENTS.md` for complete documentation.

### Code Formatting

- **Auto-format on commit**: Pre-commit hooks automatically run Prettier to format code
- **Manual formatting**: Use `make format` or `npm run format` to format all files and auto-fix ESLint issues
- **Prettier**: Configured with single quotes, handles all file formatting
- **ESLint**: Pre-commit checks only (no auto-fix); use `make format` to auto-fix ESLint issues
- **Before committing**: If ESLint errors exist, run `make format` to fix them before committing

### Styling & UI

- **Consult `src/app/globals.css`** for theme system before writing any CSS/Tailwind
- **Material Design-inspired**: Uses semantic color tokens (primary, on-primary, surface, etc.)
- **Light/dark mode**: Built-in theme system with `light-dark()` CSS functions
- **Prefer Tailwind**: Use utility classes following the established theme

### TypeScript

- **Avoid `any` type** - ask for help if a simple type isn't obvious
- **Zod schemas**: Use for validation, located in relevant domain files
- **Drizzle schema**: Database types auto-generated from schema files
- **NEVER use dynamic imports** - always use top-level static imports. Avoid `await import()` or conditional imports

### Docker & Infrastructure

- **Docker MCP available**: For inspecting logs and restarting containers
- **Database**: SQLite locally, Turso (SQLite-compatible) in production
- **Deployment**: Cloudflare Pages with `npm run deploy`

## Common Development Tasks

### Database Operations

See `src/lib/db/AGENTS.md` for detailed database commands including:

- Migration management (generate, migrate, reconcile, custom migrations)
- Data operations (seed, dataload)
