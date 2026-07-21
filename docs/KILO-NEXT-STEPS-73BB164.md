# Kilo Next Steps After Re-audit of `73bb164`

## Verdict

The branch still passes lint, TypeScript, 239 Vitest tests, and production build. It is **not** ready to resume chunks 101–200. No test files changed after `dbbda5e`, so none of the new fixes has regression coverage. Several fixes are incomplete or incorrect.

Work only in the order below. For each item, first add a test that fails on `73bb164`, then implement, run targeted tests, `npm run verify`, isolated Playwright, and a real Postgres/PostGIS integration suite. Update status honestly and commit atomically.

## Gate 1 — Fix autosave before any other feature

### N01 — Resolve slug on autosave GET

`POST /api/designs/autosave` resolves slug to UUID; GET does not. The workspace calls GET with `p10-parkside-georgetown`, which is compared directly to a UUID column. Resolve the slug using the same tenant-scoped resolver before querying.

**Required test:** Seed a UUID project with Parkside slug, save by slug, GET by slug, and assert exact latest elements.

### N02 — Stop hydration from immediately becoming dirty

The current effect sets `initializedRef.current = true` and then calls `markDirty()` in the same invocation. Both restored and fixture state are therefore immediately autosaved. Introduce explicit hydration status and capture a baseline version/hash after `loadElements`; dirty tracking must begin only on a subsequent user mutation.

**Required test:** Loading fixtures or saved state causes zero POSTs after the debounce interval; a subsequent edit causes exactly one POST.

### N03 — Implement real ETag compare-and-swap

Returning an ETag is not conflict protection. The client does not store/send it, and POST does not compare it. Require `If-Match` or a validated base revision; atomically reject stale saves with 409 and return server metadata.

**Required test:** Two clients load the same revision; first saves; second receives 409 and cannot overwrite.

### N04 — Fix edits during save, retry, and unload behavior

The old hook remains unchanged: it clears dirty state after an old request even if newer edits occurred; error state does not reschedule; `sendBeacon` cannot attach the bearer header used by auth. Track local change versions, resave after in-flight mutation, implement bounded retry/manual retry, and remove unsupported token-in-body beacon behavior.

**Required tests:** edit-during-save, failed-save-then-edit, reconnect retry, no false “saved” status, and documented unload limitations.

### N05 — Separate working head from immutable history

Every autosave still inserts a new snapshot forever. Add a mutable working head or a retention/compaction model while keeping named checkpoints and submissions immutable.

**Required test:** 100 autosaves do not create 100 permanent revision records; referenced checkpoints/submissions remain intact.

## Gate 2 — Complete authorization and validation

### N06 — Fix restore GET IDOR and restore target validation

GET still checks only snapshot ID + organization, not owner/capability. POST checks ownership but accepts an arbitrary target `projectId`, does not use Zod, does not resolve slug, and does not verify it matches the snapshot project.

**Required tests:** same-org second student cannot GET/restore; instructor access follows explicit capability; cross-project restore is rejected or explicitly forked through a governed flow.

### N07 — Finish Zod coverage

At least these JSON routes still lack Zod: auth login/invite/accept, curriculum stages, checkpoints, conflicts, design export, restore, reviews, save, DWG approval/status, export package, grading, and progress. Use shared strict schemas, not scattered permissive route-local definitions. Replace `z.any()` geometry and unbounded strings/arrays.

**Required tests:** malformed JSON, unknown keys, oversize payloads, invalid UUID/slug, invalid geometry/coordinates, invalid enums, and NaN/Infinity.

### N08 — Complete endpoint-capability matrix

Role checks added to competency and QA POST are only partial. Review routes still permit arbitrary authenticated mutations; DWG metadata and several instructor resources remain overly broad. `require-role.ts` throws generic errors and is unused as a proper HTTP authorization layer.

**Required tests:** student/instructor/admin/support across every method on all new endpoints, with two users and two organizations.

### N09 — Refresh only active membership and preserve full claims

Refresh queries membership without `status = active`; a deactivated member still refreshes. It also does not restore `is_platform_staff`. Load active membership and full current user state in one governed service.

**Required tests:** deactivated membership, disabled user, role change, platform staff, org removal, replay, and concurrent rotation.

## Gate 3 — Make submission authoritative and atomic

### N10 — Load the correct basemap

Submission calls `loadParcels(slug)` and `loadAddresses(slug)`. The loader expects `project.basemapId`; Parkside uses `wilco-l131725c`. It currently falls through without basemap, so trespass/boundary checks may be not-evaluated.

**Required test:** Parkside submission loads 554 parcels/557 addresses and produces the same geometry-aware checks as `/api/grading`.

### N11 — Transactional submission

Snapshot, grade, attempt, and progress are still separate operations. Wrap them in one database transaction with idempotency. Add a uniqueness strategy for attempt numbers and prevent concurrent duplicates.

**Required tests:** injected failure rolls everything back; repeated idempotency key returns the same submission; concurrent calls get unique attempts.

### N12 — Preserve best score and enforce identical gates

Progress still overwrites `bestScore` with a lower result. Submission still uses `result.isPassing` rather than the mandatory gate policy implemented in the grading route. Consolidate one authoritative grading service.

**Required tests:** lower later attempt preserves best score; mandatory gate failure prevents pass even above threshold; historical versions reproduce.

## Gate 4 — Reconcile database and migrations

### N13 — Finish schema reconciliation

Removing `owner_name` was correct, but all major migration/Drizzle mismatches remain: text versus PostGIS geometry, parcel/premise/ROW/constraint enums, review statuses, notification types, review nullability/types, and numeric representations.

**Required evidence:** fresh database migration, previous-version upgrade, schema introspection diff, and representative Drizzle writes for every new table.

### N14 — Make PostGIS columns authoritative

Parallel `geom` columns remain unbackfilled and unused by Drizzle/repositories. Choose authoritative spatial columns, backfill and validate SRIDs, add constraints/indexes, and exercise spatial queries/plans.

**Required tests:** insert, transform, bbox, containment, nearest neighbor, invalid SRID, and `EXPLAIN ANALYZE` index use.

## Gate 5 — Stop representing stubs as features

### N15 — Persist or remove the façade endpoints

These remain non-production façades:

- Competencies: GET always returns empty evidence; POST trusts instructor payload and persists nothing.
- Standards: GET empty; POST returns timestamp object and persists nothing.
- QA: evaluates arbitrary dispositions but persists nothing and does not validate revision access.
- Redlines: returns ephemeral object; GET always empty.
- Hints: any tier still directly accessible; no design/check verification or persistence.
- Optical: trusts caller-supplied paths rather than deriving canonical topology.
- Notifications: now reads rows, but no producing flows/read-state API and unread count is only within limited page.

Implement each vertically with schema/repository/auth/UI/history, or remove/downgrade it in status until implemented. Do not call “Zod added” completion.

### N16 — Fix export package

The previous export defects remain untouched: hardcoded Parkside UI, mutable client inputs, wrong `buildBOM` input, JSON response rather than downloadable archive, snapshot table misuse, alert-only UX, unsafe CSV escaping/formulas.

**Required test:** export authorized persisted revision, download/unzip, validate checksum/manifest/GeoJSON/CSV/BOM, and reject cross-tenant access.

## Gate 6 — Make verification truthful

### N17 — Fix Playwright isolation

Playwright still uses hardcoded port 3000 with `reuseExistingServer`, so it can test another application. Use a unique configurable port and an app identity/commit health assertion. Run against a fresh dedicated database/tenant.

**Required evidence:** two clean consecutive runs with all tests passing. Do not rely on the committed report from the wrong app.

### N18 — Remove generated Playwright report from Git

`playwright-report/` was committed. Remove it from version control and ignore generated Playwright/test artifacts. Preserve only intentional summarized evidence in `docs/`.

### N19 — Add regression and integration tests

No test file changed in commits `9d568fb`, `2fa943a`, or `73bb164`; the count remains 239. Add tests for every repair above and demonstrate pre-fix failure. Pure library tests do not prove route/database/UI behavior.

### N20 — Update status and metrics at current SHA

`STATUS.md` remains pinned to `1ef7ce6`, 222 tests, and 40 routes. Re-audit at the final repair SHA. Use separate columns for library, route exists, persisted, UI wired, integration tested, live verified, and production accepted.

## Final no-go / go gate

Do not resume feature chunks until all of the following pass from a clean checkout:

1. `npm run verify`.
2. Fresh and upgrade Postgres/PostGIS migration suites.
3. Full endpoint role/tenant/validation integration suite.
4. Autosave restore, no-hydration-save, ETag conflict, retry, checkpoint, and reload E2E.
5. Atomic submission with real Parkside basemap and consistent grading gates.
6. Isolated Playwright twice, all passing.
7. No generated reports or runtime artifacts tracked.
8. Truthful current status matrix and exact route/test metrics.

If any gate is unavailable, state it as blocked; do not substitute compilation for production verification.
