# Development Workflow

This document describes the code quality workflow and precommit hooks used across all development entry points.

## Overview

Tetrastack uses a unified precommit system that ensures code quality checks are consistent across Git commits, Claude Code sessions, and Gemini CLI sessions. All entry points execute the same central script (`bin/precommit`) via symlinks.

## Central Precommit Script

**Location**: `bin/precommit`

The central precommit script runs the following checks in order:

1. **Code Formatting and Linting** - Uses Biome to format code and check for lint issues
2. **Static Type Checking** - Runs TypeScript compiler in no-emit mode
3. **Unit Tests** - Executes the unit test suite

All checks must pass for the script to succeed. If any check fails, the entire script exits with a non-zero status.

## Entry Points

All development entry points symlink to the central `bin/precommit` script:

### Git Pre-commit Hook

**Location**: `.husky/pre-commit` → `../bin/precommit`

Runs automatically before each Git commit. Ensures that only properly formatted, type-checked, and tested code is committed to the repository.

### Claude Code Stop Hook

**Location**: `.claude/hooks/pre-commit-on-stop.sh` → `../../bin/precommit`

Configured in `.claude/settings.json` with a 180-second timeout. Runs when the Claude Code agent is stopped (conversation paused), ensuring code quality before the session ends.

### Gemini CLI Stop Hook

**Location**: `.gemini/hooks/pre-commit-on-stop.sh` → `../../bin/precommit`

Similar to Claude Code, runs when the Gemini CLI session stops.

## Code Quality Tools

### Biome

Biome is a fast, opinionated formatter and linter that replaces Prettier and parts of ESLint. Configuration is in `biome.json`.

**Key features**:
- Fast formatting for JavaScript, TypeScript, JSON, and more
- Built-in linting with auto-fix capabilities
- Automatic import organization
- VCS integration (respects `.gitignore`)

**Run manually**:
```bash
npm run format           # Format and lint with auto-fix
npx biome check --write .   # Same as above
npx biome check .        # Check only, no fixes
```

**Configuration highlights** (from `biome.json`):
- Indent style: 2 spaces
- Quote style: single quotes
- Includes: `src/**`, `tests/**`, `scripts/**`
- Organize imports: enabled

### TypeScript Type Checking

TypeScript's compiler (`tsc`) runs in `--noEmit` mode to check types without generating output files.

**Run manually**:
```bash
npm run typecheck
npx tsc --noEmit
```

### Unit Tests

The unit test suite runs via Vitest. Tests must pass before code can be committed.

**Run manually**:
```bash
npm run test:unit
```

## Workflow Details

### When Precommit Checks Run

1. **Before Git commits**: Automatically via Husky hook
2. **When stopping Claude Code**: Automatically via Claude settings
3. **When stopping Gemini CLI**: Automatically via Gemini settings
4. **In CI/CD pipelines**: Runs in GitHub Actions workflows

### CI Integration

The GitHub Actions CI workflow (`.github/workflows/web.tests.yml`) runs the same code quality checks:

1. **Biome check**: `npx biome check --diagnostic-level=error .` - Checks formatting and linting without modifying files
2. **ESLint**: `npm run lint` - Runs additional linting checks
3. **TypeScript**: `npm run typecheck` - Validates type correctness
4. **Tests**: Runs unit, integration, and E2E tests

The Makefile `lint` and `ci` targets also include these checks for Docker-based development.

### What Happens on Failure

If any check fails:
- Git commits are blocked (you must fix issues and retry)
- Claude Code/Gemini CLI sessions show the error output
- You must address the failures before proceeding

### Skipping Hooks (Not Recommended)

You can skip Git precommit hooks with:
```bash
git commit --no-verify
```

However, this is **strongly discouraged** as it bypasses code quality checks that help maintain codebase consistency.

## Symlink Resolution

The central script uses `readlink -f "$0"` to resolve symlinks, allowing it to determine the correct repository root regardless of which symlink called it. This ensures the script can find `node_modules` and run npm commands correctly.

## Making Changes

### Updating the Precommit Script

Edit `bin/precommit` directly. Changes automatically apply to all entry points since they symlink to this file.

### Adding New Checks

To add a new check:
1. Add the command to `bin/precommit`
2. Update this documentation
3. Update the functional specification comment in `bin/precommit`

### Changing Tool Configuration

- **Biome**: Edit `biome.json`
- **TypeScript**: Edit `tsconfig.json`
- **Tests**: Edit `vitest.config.ts` or `vitest.config.components.ts`

## Troubleshooting

### Script Not Executing

Ensure the script is executable:
```bash
chmod +x bin/precommit
```

### Symlinks Broken

Recreate symlinks:
```bash
# Git hook
ln -sf ../bin/precommit .husky/pre-commit

# Claude Code hook
ln -sf ../../bin/precommit .claude/hooks/pre-commit-on-stop.sh

# Gemini CLI hook
mkdir -p .gemini/hooks
ln -sf ../../bin/precommit .gemini/hooks/pre-commit-on-stop.sh
```

### Checks Taking Too Long

The timeout for Claude/Gemini hooks is set to 180 seconds. If checks regularly exceed this:
1. Review test performance
2. Consider reducing test scope in precommit
3. Update timeout in `.claude/settings.json` (if needed)

### Biome Issues

If Biome reports errors, fix them with:
```bash
npm run format
```

Or check what would change:
```bash
npx biome check .
```

## Best Practices

1. **Run checks locally** before committing to catch issues early
2. **Keep checks fast** - precommit should complete in under 60 seconds typically
3. **Fix issues immediately** - don't commit with `--no-verify` to bypass checks
4. **Update documentation** when changing the precommit workflow
5. **Test the precommit script** after making changes to ensure it works correctly

## Related Documentation

- [Claude Hooks Pattern](./claude-hooks.md) - Detailed guide on Claude Code hooks
- [TDD and Coverage](./tdd-and-coverage.md) - Testing conventions
- [Copilot Agent](./copilot-agent.md) - Agent-specific instructions
