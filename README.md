# Tetrastack

A production-ready, full-stack TypeScript boilerplate for building modern web applications. Tetrastack combines Next.js, Drizzle ORM, Auth.js, and Cloudflare Workers into a cohesive development experience designed with AI agents in mind and inspired by Ruby on Rails conventions.

## Why Tetrastack?

Modern web development requires piecing together numerous technologies. Tetrastack provides a battle-tested foundation that lets you focus on building your application, not configuring infrastructure.

### Key Features

- **Full-Stack TypeScript**: End-to-end type safety from database to UI
- **Agent-First Design**: Optimized for AI-assisted development with comprehensive documentation
- **Rails-Inspired Architecture**: Convention over configuration with clear patterns
- **Modern Stack**: Built with the latest stable versions of Next.js 15, React 19, and TypeScript
- **Production Ready**: Deployed to Cloudflare Workers with Turso database and R2 file storage
- **Comprehensive Testing**: Three-tier testing approach (unit, integration, E2E)
- **Developer Experience**: Hot reload, Docker development, automated migrations
- **File Upload Support**: Integrated Cloudflare R2 for scalable object storage

## Technology Stack

### Frontend

- **Next.js 15** (App Router) - React framework with server components
- **React 19** - Latest React with enhanced server capabilities
- **TypeScript** - Full type safety across the stack
- **TailwindCSS** - Utility-first styling with custom theme system

### Backend

- **Next.js API Routes & Server Actions** - Serverless API endpoints
- **Auth.js (NextAuth v5)** - Flexible authentication framework
- **Drizzle ORM** - TypeScript-first ORM with excellent DX
- **Zod** - Runtime type validation

### Database & Deployment

- **Turso** - Edge SQLite database for production
- **SQLite** - Local development database
- **Cloudflare R2** - S3-compatible object storage for file uploads
- **Cloudflare Workers** - Edge deployment with OpenNext
- **Cloudflare Pages** - Static asset hosting

### Testing & Quality

- **Vitest** - Fast unit and integration testing
- **Playwright** - Reliable E2E testing
- **Fishery + Faker** - Type-safe test data factories
- **ESLint + Prettier** - Code quality and formatting

## Agent-First Philosophy

Tetrastack is designed to work seamlessly with AI coding assistants like Claude Code. Every architectural decision includes:

- **Comprehensive Documentation**: README files in key directories explaining patterns
- **Clear Conventions**: Predictable structure following Rails-inspired principles
- **Type Safety**: Full TypeScript coverage for better AI understanding
- **MCP Server Integration**: TypeScript LSP, Docker, and Playwright servers available
- **CLAUDE.md**: Detailed instructions for AI assistants working with the codebase

## Rails-Inspired Architecture

Tetrastack borrows successful patterns from Ruby on Rails:

### Convention Over Configuration

- **Models Layer** (`src/models/`): Database operations and business logic
- **Actions Layer** (`src/actions/`): Server actions for mutations (prefer over API routes)
- **Many-First Pattern**: All CRUD operations work with arrays by default
- **Generic Admin**: Reusable CRUD interfaces powered by Drizzle schemas

### Developer Happiness

- **Sensible Defaults**: Pre-configured with best practices
- **Clear Patterns**: Consistent structure across features
- **Migration Management**: Easy database schema evolution
- **Test Factories**: Reduce boilerplate with smart defaults

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Docker and Docker Compose (recommended for development)

### Development with Docker (Recommended)

```bash
# Start all services in detached mode, run migrations, and follow logs
make up

# Stop all services
make down

# Clean all services and delete database files
make destroy
```

### Development without Docker

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

### Development Credentials

For quick testing during development:

- **Admin access**: Password "admin" with any suffix (e.g., "admin-123")
- **Regular user**: Password "password" with any suffix (e.g., "password-456")

**Note**: These are development-only credentials and should never be used in production.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/             # API routes (use sparingly, prefer server actions)
│   ├── [feature]/       # Feature-based page organization
│   └── globals.css      # Theme system with light/dark mode
├── lib/
│   ├── db/              # Database schema and connection
│   │   └── README.md    # Database patterns and migration management
│   ├── admin/           # Generic admin CRUD system
│   ├── models/          # Model factory utilities
│   └── [utilities]      # Business logic, calculations, utils
├── models/              # Database operations and business logic
│   └── README.md        # Models layer architecture
├── actions/             # Server actions (preferred for mutations)
│   └── README.md        # Actions layer patterns
├── agents/              # AI agents
│   └── README.md        # Agent design principles
└── components/          # Reusable React components

tests/
├── README.md            # Testing architecture and guidelines
├── e2e/                 # Playwright E2E tests
│   └── README.md        # E2E testing guidelines and fixtures
├── integration/         # Integration tests
├── unit/                # Unit tests
├── agents/              # Agent integration tests
└── factories/           # Test data factories
    └── README.md        # Factory pattern documentation (87% less test code!)
```

**Important**: Directories with README.md files contain detailed documentation. Always read these when working in those areas.

## Testing

Tetrastack uses a comprehensive three-tier testing approach:

### Test Structure

- **Unit Tests** (`tests/unit/`): Test individual functions and utilities
- **Integration Tests** (`tests/integration/`): Test component and action interactions
- **End-to-End Tests** (`tests/e2e/`): Test complete user workflows with Playwright

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only

# Run CI pipeline (linting + all tests)
make ci
```

### Test Data Factories

Tetrastack uses the factory pattern (Fishery + Faker) to reduce test code by 87%:

```typescript
// ✅ Good - Uses all defaults
await userFactory.create();

// ✅ Good - Uses traits for variation
await foodFactory.processed().fat().create();

// ⚠️ Use sparingly - Only when testing requires specific values
await userFactory.create({ email: 'specific@example.com' });
```

See [tests/factories/README.md](tests/factories/README.md) for detailed documentation.

## Database Management

### Migrations

```bash
# Generate a new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema changes (development only)
npm run db:push

# Open database studio (GUI)
npm run db:studio
```

### Migration Conflicts

When working with database migrations on different branches:

```bash
# Reset drizzle folder from main branch and regenerate migrations
make migration-reconcile
```

Use this to:

- Regenerate migrations after rebasing with conflicts
- Consolidate multiple migrations on a feature branch
- Clean up migration files before creating a pull request

See [src/lib/db/README.md](src/lib/db/README.md) for complete database documentation.

## Many-First Design Pattern

**Critical Architecture Principle**: All model CRUD operations work with arrays by default.

```typescript
// ✅ Correct - Use array operations
const [user] = await insertUsers([userData])
const [updated] = await updateUsers([eq(users.id, id)], updates)
await deleteUsers([eq(users.id, id)])

// ❌ Incorrect - Don't create single-record wrappers
async function createUser(data) { ... }  // NO!
async function updateUser(id, data) { ... }  // NO!
```

**Benefits**:

- Less code duplication
- Consistent API across all models
- Type-safe with full inference
- Easier to maintain

## Styling & Theming

Tetrastack includes a comprehensive theme system in `src/app/globals.css`:

- **Material Design-inspired**: Semantic color tokens (primary, surface, etc.)
- **Light/Dark Mode**: Built-in with `light-dark()` CSS functions
- **TailwindCSS Integration**: Utility classes following the theme system

**Always consult `src/app/globals.css` before writing custom styles.**

## MCP Servers

Tetrastack integrates with Model Context Protocol servers for enhanced AI development:

- **TypeScript Language Server**: Type-aware code intelligence and refactoring
- **Docker MCP**: Container management and debugging
- **Playwright MCP**: Browser automation for E2E testing

See [CLAUDE.md](CLAUDE.md) for complete MCP server documentation.

## Deployment

### Cloudflare Workers

```bash
# Deploy to Cloudflare
npm run deploy
```

Tetrastack uses OpenNext for Cloudflare Workers deployment, providing:

- Edge computing for low latency
- Automatic scaling
- Global CDN distribution
- Integration with Turso edge database
- Cloudflare R2 for file storage and uploads

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=         # Turso database URL
DATABASE_AUTH_TOKEN=  # Turso auth token

# Authentication
AUTH_SECRET=          # NextAuth secret
AUTH_URL=             # Application URL

# Cloudflare R2 (File Storage)
R2_ACCOUNT_ID=        # Cloudflare account ID
R2_ACCESS_KEY_ID=     # R2 access key ID
R2_SECRET_ACCESS_KEY= # R2 secret access key
R2_BUCKET_NAME=       # R2 bucket name

# Application
NODE_ENV=production
```

## Contributing

Tetrastack is designed to be forked and customized for your needs. Key customization points:

1. **Database Schema**: Modify `src/lib/db/schema.*.ts` files
2. **Authentication**: Configure providers in `src/lib/auth.ts`
3. **Theme**: Customize colors in `src/app/globals.css`
4. **Admin Interface**: Extend generic admin in `src/lib/admin/`

## Architecture Documentation

For detailed architecture documentation, see:

- [CLAUDE.md](CLAUDE.md) - Complete development guide and AI assistant instructions
- [src/lib/db/README.md](src/lib/db/README.md) - Database architecture and patterns
- [src/models/README.md](src/models/README.md) - Models layer documentation
- [src/actions/README.md](src/actions/README.md) - Server actions patterns
- [tests/README.md](tests/README.md) - Testing architecture
- [tests/factories/README.md](tests/factories/README.md) - Factory pattern guide

## Development Commands

```bash
# Development
make up              # Start all services with Docker
make down            # Stop all services
make destroy         # Clean all services and delete database

# Database
make migration-reconcile  # Resolve migration conflicts

# Testing
make ci              # Run linting + all tests
make e2e             # Run E2E tests in Docker

# Code Quality
make format          # Format code with Prettier + ESLint auto-fix
```

See the [Makefile](Makefile) for all available commands.

## License

MIT

## Built With Tetrastack

Have you built something with Tetrastack? Open a PR to add it here!
