# Chunk 9: Virtualized Attribute Table

- Commit SHA: <will be filled after commit>
- Scope: Virtualized attribute table in bottom panel with layer selector, text filter, column visibility, sort, bidirectional selection sync, CSV export

## git diff --stat
```
 src/app/api/features/route.ts                   | 71 +++++++++++++++++++++
 src/components/workspace/BottomPanel.tsx         | 88 ++++++++++++++++----------
 src/components/workspace/AttributeTable.tsx      | 54 ++++++++++++++++
 src/lib/attribute-table.test.ts                  | 69 +++++++++++++++++++++
 docs/chunk-reports/chunk-09.md                   | 22 ++++++++
 package.json                                     |  1 +
```

## New test files
- `src/lib/attribute-table.test.ts` (69 lines, 7 tests)

## Test count
- Before: 110
- After: 117

## Targeted test results
- `npm test`: 117 passed
- `npm run lint`: 0 errors
- `npm run typecheck`: passes
- `npm run build`: passes

## Deferred items (explicit)
- Server-side pagination API endpoint not fully functional (requires DB)
- Bulk edit, calculate-field, saved views
- 50k-row performance fixture
- Multi-layer source support in features API

## Known limitations
- Table uses client-side Zustand data (not server DB) since DB connection is optional
- Virtualization uses `@tanstack/react-virtual` with estimated row heights
- CSV export is client-side only, not audited server-side
