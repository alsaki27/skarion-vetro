# Migration Runbook

## Principles

1. **All SQL migrations are forward-only.** Rollback is performed by applying
   a compensating migration, never by editing or dropping an applied migration.
2. **Operational rollback** restores from the most recent validated backup and
   re-applies all migrations up to the desired point.
3. **Every migration** must be tested against a disposable clone of production
   before running against a live database.

## Applying migrations

```bash
# Apply all pending migrations in order
for f in migrations/*.sql; do
  echo "Applying $f..."
  psql "$NEON_DATABASE_URL" -f "$f"
done
```

Drizzle Kit can also handle migrations:

```bash
npm run db:migrate
```

## Migration `0005` — specific notes

| Change | Risk | Rollback |
|---|---|---|
| FK `parent_container_id` → `network_elements(id)` ON DELETE SET NULL | Low — existing NULL values are valid | `ALTER TABLE network_elements DROP CONSTRAINT fk_network_elements_parent_container` |
| FK `start_element_id` → `network_elements(id)` ON DELETE SET NULL | Low — existing NULL values are valid | `ALTER TABLE network_elements DROP CONSTRAINT fk_network_elements_start_element` |
| FK `end_element_id` → `network_elements(id)` ON DELETE SET NULL | Low | `ALTER TABLE network_elements DROP CONSTRAINT fk_network_elements_end_element` |
| Composite tenant indexes | None — CREATE IF NOT EXISTS | `DROP INDEX IF EXISTS idx_...` |
| `updated_at` on `projects` | None — new column | No rollback needed (no downstream dependency) |
| `updated_at` on `grading_results` | None — new column | No rollback needed |

## Deferred items — runbooks

### Making `org_id` NOT NULL

```sql
-- 1. Dry-run: find rows without org_id
SELECT 'projects' AS tbl, COUNT(*) FROM projects WHERE org_id IS NULL
UNION ALL
SELECT 'network_elements', COUNT(*) FROM network_elements WHERE org_id IS NULL
UNION ALL
SELECT 'design_snapshots', COUNT(*) FROM design_snapshots WHERE org_id IS NULL
UNION ALL
SELECT 'grading_results', COUNT(*) FROM grading_results WHERE org_id IS NULL
UNION ALL
SELECT 'candidate_progress', COUNT(*) FROM candidate_progress WHERE org_id IS NULL;

-- 2. Backfill from context (example for projects linked to an org)
UPDATE projects SET org_id = (SELECT id FROM organizations LIMIT 1)
WHERE org_id IS NULL;

-- 3. Add NOT NULL constraint
ALTER TABLE projects ALTER COLUMN org_id SET NOT NULL;
-- Repeat for each tenant-scoped table.
```

### Fixing geography column types

This requires a multi-step migration:

```sql
-- 1. Add new geography column alongside the text column
ALTER TABLE projects ADD COLUMN map_center_geo GEOGRAPHY(POINT, 4326);
UPDATE projects SET map_center_geo = ST_GeogFromText('SRID=4326;POINT(' || map_center || ')')
WHERE map_center IS NOT NULL;

-- 2. Drop the old text column and rename
ALTER TABLE projects DROP COLUMN map_center;
ALTER TABLE projects RENAME COLUMN map_center_geo TO map_center;

-- 3. Update Drizzle schema to use a custom column type
-- See ADR-XXXX for the custom type implementation
```

This is deferred because the application code currently writes GeoJSON
coordinates as text. Both the application code and the Drizzle schema must
change together.
