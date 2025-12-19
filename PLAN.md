# PLAN: Refactor from Household to Organization/Team/Project Model

## Goal

Refactor all documentation and code to replace the "household" and "meal planning" terminology with an organization-based model where:

- **Organizations (Teams)** contain members
- Each organization has many **Projects**
- Remove all household and meal planning references from documentation

## Context

### Current State

The codebase already has the correct database schema:

- `teams` table with `teamMemberships` (org with members) - in `src/database/schema.teams.ts`
- `projects` table linked to teams - in `src/database/schema.projects.ts`

However, the **documentation still references the old meal planning domain (Meze)** with "households", "meal planning", "recipes", "foods", etc.

### Files Requiring Changes

**Documentation Files:**

1. `AGENTS.md` - Root documentation with Meze business domain and household references
2. `src/database/AGENTS.md` - References household schema that doesn't exist
3. `tests/integration/AGENTS.md` - References household test data
4. `tests/factories/AGENTS.md` - References household factory
5. `src/data/mezeConfig.json` - Entire file is meal planning focused
6. `src/components/AccountDropdown.tsx` - Has household navigation link
7. `.specify/memory/constitution.md` - May have meal planning references
8. `.claude/agents/*.md` - Agent docs may reference Meze domain
9. `.claude/skills/*/SKILL.md` - Skill docs may reference Meze domain
10. `docs/*.md` - Various docs may reference old domain

**Code Files:**

1. `src/components/AccountDropdown.tsx` - Replace household link with team/organization link
2. `tests/meal-plan-shopping-list.spec.ts` - Likely obsolete test file
3. `tests/e2e/page-objects/BasePage.ts` - May have household references

## Tasks

### Phase 1: Update Root Documentation

- [ ] 1. Update `AGENTS.md` - Replace business domain section, database architecture, key features with organization/team/project focus
- [ ] 2. Remove or update `src/data/mezeConfig.json` - Either delete or repurpose for new domain

### Phase 2: Update Database Documentation

- [ ] 3. Update `src/database/AGENTS.md` - Remove household schema section, ensure teams/projects documented correctly

### Phase 3: Update Test Documentation

- [ ] 4. Update `tests/integration/AGENTS.md` - Replace household references with team/project
- [ ] 5. Update `tests/factories/AGENTS.md` - Remove household factory example, add team/project factory examples
- [ ] 6. Remove or update `tests/meal-plan-shopping-list.spec.ts` - Obsolete test

### Phase 4: Update Code Files

- [ ] 7. Update `src/components/AccountDropdown.tsx` - Replace household link with teams/organization link

### Phase 5: Update Agent/Skill Documentation

- [ ] 8. Update `.specify/memory/constitution.md` - Remove meal planning references
- [ ] 9. Update `.claude/agents/*.md` - Remove Meze/meal planning references
- [ ] 10. Update `.claude/skills/*/SKILL.md` - Remove meal planning references

### Phase 6: Update Other Documentation

- [ ] 11. Review and update `docs/*.md` files for any household/meal planning references
- [ ] 12. Update `tests/e2e/AGENTS.md` - Remove meal planning test references

### Phase 7: Cleanup

- [ ] 13. Delete any orphaned household-related files
- [ ] 14. Remove coverage files and screenshots related to households (`.playwright-mcp/household-*.png`)
- [ ] 15. Run `make ci` to verify all changes work correctly

## Notes

### New Business Domain Description (Suggested)

Tetrastack is a project management platform that enables:

- **Organizations/Teams**: Groups of users collaborating together
- **Projects**: Work tracked within teams with status, priority, and tags
- **Tasks**: Individual work items within projects

### Key Terminology Changes

| Old Term          | New Term          |
| ----------------- | ----------------- |
| household         | team/organization |
| household members | team members      |
| meal planning     | project planning  |
| recipes           | - (remove)        |
| meals             | - (remove)        |
| foods             | - (remove)        |
| nutrients         | - (remove)        |
| Meze              | Tetrastack        |

### Database Entities to Document

Current actual entities (from `src/database/schema.ts`):

- users, accounts, sessions (auth)
- teams, teamMemberships
- projects, projectTags
- tasks
- tags
- jobs
- agentStates

## Progress

_Track completed tasks here as work progresses_
