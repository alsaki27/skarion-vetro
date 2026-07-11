# ADR 0002 — Domain separation: curriculum projects vs. student designs

**Status:** Accepted  
**Date:** 2026-07-11  
**Drivers:** Immutability of published curriculum, version pinning of student work, clear boundary between authoring and learning

## Context

The original prototype stored project definitions as hardcoded TypeScript
fixtures (`src/lib/projects/`) and relied on client-side grading. As the
platform moves to a multi-tenant SaaS, project definitions must become
versioned database content while student designs remain separate,
independently versioned, and tenant-scoped.

## Decision

### Separation principles

1. **Curriculum projects** live in `curriculum_projects` and
   `curriculum_project_versions` tables. They are authored by instructors
   and published immutably.

2. **Student designs** live in `designs`, `design_snapshots`, and
   `design_attempts` tables. Each student design is pinned to exactly one
   published project version.

3. **Assignment** is the bridge — it connects a cohort to a published
   project version at a specific point in time. Changing the project version
   after students begin is not allowed; a new assignment must be created.

4. **Grading** uses the project version's stored rules, not the current
   live definition. Regrading the same design revision produces identical
   results regardless of subsequent project edits.

### Non-goals

- This ADR does not prescribe the exact database schema or migration order.
  That is handled by the consolidation migration (Chunk 3) and the versioned
  project model (Chunk 11).
- This ADR does not deprecate the fixture-based `ProjectFixture` interface.
  Fixtures remain the development-time source of truth until the project
  import/seed script (Chunk 11) is built.

## Consequences

- `ProjectFixture` in `src/lib/types.ts` must remain compatible with the
  database schema for the import path.
- All grading functions must accept project configuration as data, not
  import it from a hardcoded registry.
- Published version immutability must be enforced at the database level
  (no UPDATE on published rows) and the API layer.
- The domain glossary (`docs/domain-glossary.md`) is the single source of
  truth for entity definitions.
