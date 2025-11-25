<!--
Sync Impact Report - Constitution v1.0.1

Version Change: 1.0.0 → 1.0.1 (PATCH)
Rationale: Clarification of test strategy to avoid superfluous tests by defining clear guidance on where different test types should be written.

Modified Principles:
  1. Test-First Development (NON-NEGOTIABLE) - Added test strategy guidance
     - E2E tests focus on happy paths (successful user journeys)
     - Unhappy paths (edge cases, errors, validation) ideally written at unit/integration/component level
     - Avoids slow, superfluous E2E tests for error conditions
     - Factories/fixtures reduce test code by 87% and improve maintainability

Templates Requiring Updates:
  ✅ No template updates required - clarification only

Previous Version History:
  v1.0.0 (2025-11-11): Initial constitution creation with 7 core principles
-->

# Application Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

TDD mandatory for all feature implementation:

- Tests MUST be written before implementation code
- Tests MUST fail before implementation begins
- Red-Green-Refactor cycle strictly enforced
- Test data factories MUST be used instead of manual object construction
- Three-tier testing approach required: unit tests for pure logic, integration tests for cross-layer interactions, E2E tests for user workflows

**Test Strategy** (avoid superfluous tests):

- **E2E tests**: Focus on happy paths—successful user journeys through the UI
- **Unit/integration/component tests**: This is where unhappy paths SHOULD be written—edge cases, error conditions, validation failures, boundary conditions
- Rationale: Testing error conditions in E2E is slow and brittle; test them at lower levels where they're faster and more precise

**Rationale**: Test-first development prevents regressions, serves as living documentation, and reduces test code by 87% through factory pattern adoption. Testing unhappy paths at appropriate levels avoids slow, superfluous E2E tests. Non-negotiable ensures quality foundation.

### II. Server-First Architecture

Server-side rendering and logic prioritized over client-side:

- Server components MUST be preferred over client components
- Server actions MUST be used for mutations instead of API routes unless specific requirements demand API routes
- Client components only when interactivity requires browser APIs or state management
- Never use `redirect()` or `permanentRedirect()` in server actions—return success/error objects and handle navigation in client

**Rationale**: Server-first architecture leverages Next.js 15 App Router strengths, improves performance through reduced client JavaScript, and simplifies state management by centralizing logic on the server.

### III. Type Safety

Strict TypeScript without escape hatches:

- `any` type is forbidden—request help if a simple type isn't obvious
- Zod schemas MUST be used for validation at system boundaries (API inputs, form data, external data)
- Drizzle schema serves as database type source of truth
- Dynamic imports forbidden—always use top-level static imports
- TypeScript LSP MCP tools MUST be preferred for refactoring operations (rename, references, definitions)

**Rationale**: Type safety catches errors at compile time, enables confident refactoring, and serves as enforced documentation. Static imports ensure bundle optimization and prevent runtime failures.

### IV. Feature Independence

Each user story must be independently implementable and testable:

- User stories MUST be prioritized (P1, P2, P3) by value delivery
- Each story MUST deliver standalone value—viable as independent MVP increment
- Tasks MUST be organized by user story in implementation plans
- Stories MUST NOT create blocking dependencies on other stories (foundational infrastructure excepted)
- Each story MUST have independent acceptance criteria and test scenarios

**Rationale**: Independent features enable parallel development, incremental delivery, and reduced risk. Teams can ship P1 story as MVP, validate, then add P2/P3 incrementally without destabilizing delivered value.

### V. Schema-Driven Data

Database schema as authoritative source for data models:

- Drizzle schema files MUST be the single source of truth for entities
- Schema changes MUST go through migration workflow (generate → review → migrate)
- Use `make migration-reconcile` to resolve migration conflicts during branch merges
- Database types automatically generated from schema—no manual duplication
- Eight domain-specific schema files organized by business domain (users, foods, recipes, meals, etc.)

**Rationale**: Schema-driven approach eliminates type drift between database and application code, enforces referential integrity, and provides clear change audit trail through migrations.

### VI. Observability

Systems must be transparent and debuggable:

- Docker MCP MUST be used for container log inspection during development
- TypeScript LSP MCP MUST be used for type diagnostics before builds
- Playwright MCP available for UI debugging and E2E test development
- Test failures MUST provide clear diagnostic information (factories include realistic data for debugging)
- Error handling MUST return structured error objects (never throw in server actions)

**Rationale**: Observability reduces debugging time, enables rapid issue diagnosis, and improves developer productivity. MCP servers provide specialized tooling for different diagnostic needs.

### VII. Simplicity & Maintainability

Start simple, justify complexity:

- Prefer established patterns over novel abstractions
- Reuse existing components and utilities before creating new ones
- Break apart components to avoid overly large files
- YAGNI (You Aren't Gonna Need It)—defer complexity until proven necessary
- Code formatting automated through pre-commit hooks (Prettier) and `make format`

**Rationale**: Simple code is maintainable code. Complexity must be justified by demonstrable need. Automated formatting eliminates style debates and ensures consistency.

## Development Workflow

### Feature Development Process

Features follow spec-driven workflow:

1. **Specify**: Create feature spec with prioritized user stories (`/speckit.specify`)
2. **Clarify**: Identify and resolve underspecified areas (`/speckit.clarify`)
3. **Plan**: Generate implementation plan with technical context (`/speckit.plan`)
4. **Tasks**: Generate dependency-ordered task list organized by user story (`/speckit.tasks`)
5. **Implement**: Execute tasks following TDD discipline (`/speckit.implement`)
6. **Analyze**: Cross-artifact consistency validation (`/speckit.analyze`)

### Branch Strategy

- Feature branches named `###-feature-name` where `###` is issue/spec number
- Main branch is `main`—PRs target main
- Use `make migration-reconcile` when rebasing feature branches with migration conflicts

### Code Review Requirements

- All PRs MUST verify constitution compliance
- Tests MUST pass before merge (unit, integration, E2E)
- Type checks MUST pass (`npm run typecheck` via `make ci`)
- Code MUST be formatted (`make format` auto-fixes ESLint and Prettier)
- Constitution violations MUST be explicitly justified in PR description with complexity tracking table

## Quality Gates

### Pre-Implementation Gates

Before starting implementation:

- [ ] Feature spec created with prioritized user stories
- [ ] Each user story has independent acceptance criteria
- [ ] Technical context defined in implementation plan
- [ ] Constitution check completed and violations justified
- [ ] Tests written and failing (Red phase of TDD)

### Pre-Merge Gates

Before merging PR:

- [ ] All tests passing (unit, integration, E2E)
- [ ] Type checks passing
- [ ] Code formatted and linted
- [ ] Constitution compliance verified
- [ ] User stories independently testable
- [ ] Complexity justified if violations exist

### Continuous Integration

`make ci` runs full quality gate pipeline:

- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Vitest)
- Integration tests (Vitest)
- Component tests (Vitest + React Testing Library)
- E2E tests (Playwright via `make e2e`)

## Governance

### Amendment Procedure

Constitution changes require:

1. Explicit documentation of changed/added/removed principles
2. Version bump following semantic versioning:
   - MAJOR: Backward incompatible governance changes or principle removals
   - MINOR: New principle added or materially expanded guidance
   - PATCH: Clarifications, wording, non-semantic refinements
3. Sync Impact Report prepended as HTML comment to constitution
4. Templates updated for consistency (plan, spec, tasks, checklist)
5. Runtime guidance files updated (CLAUDE.md, README.md, domain-specific READMEs)

### Compliance Review

- All PRs/reviews MUST verify compliance with core principles
- Violations MUST be justified using complexity tracking table in plan.md
- Pre-commit hooks enforce formatting compliance automatically
- CI pipeline enforces testing compliance (tests must pass)
- Manual review enforces architectural compliance (server-first, type safety, feature independence)

### Runtime Development Guidance

Developers and AI assistants MUST consult:

- `CLAUDE.md` for comprehensive development guidelines, MCP server usage, and project-specific patterns
- `.specify/memory/constitution.md` (this file) for non-negotiable principles and governance
- Domain-specific README files (`src/lib/db/README.md`, `tests/README.md`, `tests/e2e/README.md`, etc.) when working in those areas
- Test factory documentation (`tests/factories/README.md`) before writing tests

**Version**: 1.0.1 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-11-11
