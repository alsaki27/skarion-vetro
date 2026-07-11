# Migration Reconciliation Report

**Date:** 2026-07-11  
**Audit:** `src/db/schema.ts` vs. SQL migrations `0001`–`0004`  
**Status:** 7 drifts found; Chunk 3 forward migration (`0005`) resolves 5 of them

## Drift table

| # | Table | Column / Constraint | Migration | Drizzle Schema | Resolution |
|---|---|---|---|---|---|
| 1 | `projects` | `map_center` | `GEOGRAPHY(POINT, 4326)` | `text` | ⏳ Deferred — requires column type change in PostGIS; add migration SQL |
| 2 | `network_elements` | `geometry` | `GEOGRAPHY(GEOMETRY, 4326)` | `text` | ⏳ Deferred — same as above |
| 3 | `network_elements` | GIST index | Uses `geometry` (geography) | Uses `geometry` (text) | ⏳ Invalid as-is; index is meaningless on text |
| 4 | `network_elements` | `parent_container_id` FK | Missing (column added via DO block) | Missing | ✅ Migration `0005` adds FK ON DELETE SET NULL |
| 5 | `network_elements` | `start_element_id` FK | `REFERENCES network_elements(id)` (no ON DELETE) | Missing (plain uuid) | ✅ Migration `0005` adds FK ON DELETE SET NULL |
| 6 | `network_elements` | `end_element_id` FK | `REFERENCES network_elements(id)` (no ON DELETE) | Missing (plain uuid) | ✅ Migration `0005` adds FK ON DELETE SET NULL |
| 7 | All tenant tables | `org_id` | `NULL` (new column) | `NULL` | ⏳ Deferred — requires safe backfill before NOT NULL |
| 8 | `design_snapshots`, `grading_results`, `design_attempts`, `candidate_progress` | Composite tenant index `(org_id, created_at DESC)` | Missing | Missing | ✅ Migration `0005` adds |
| 9 | `projects` | `updated_at` | Missing | Missing | ✅ Migration `0005` adds |
| 10 | `grading_results` | `updated_at` | Missing | Missing | ✅ Migration `0005` adds |

## ⏳ Deferred items

### Geography type columns (#1, #2, #3)

The migration creates `map_center` as `GEOGRAPHY(POINT, 4326)` and `geometry` as
`GEOGRAPHY(GEOMETRY, 4326)`, but the Drizzle schema models them as `text`.
PostGIS GIST indexes on text columns are non-functional. Fixing this requires:

1. Adding new geography columns alongside the text columns
2. Backfilling with `ST_GeogFromText()` conversion of the existing text values
3. Rebuilding indexes
4. Migrating application code to write geography types instead of WKT text

**Risk:** Application code currently writes GeoJSON `coordinates` arrays as
text. Changing the column type breaks the Drizzle insert/update API without a
custom column type. Deferred to a dedicated geography ADR and migration.

### `org_id` NOT NULL after backfill (#7)

The migration adds `org_id` as nullable. Before making it NOT NULL:

1. Ensure every existing row has a valid `org_id` (backfill from related tables
   or set a default organization)
2. Add a CHECK constraint or application-level guard
3. Once backfilled, `ALTER COLUMN org_id SET NOT NULL`

**Risk:** Production data may have NULL org_ids from before the migration. A
dry-run query must be executed before the ALTER.

## Migration `0005` — applied changes

See `migrations/0005_chunk3_consolidation.sql` for the forward-only migration
that resolves items 4, 5, 6, 8, 9, and 10.
