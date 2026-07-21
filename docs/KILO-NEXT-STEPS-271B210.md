# Kilo repair loop after `271b210`

## Audited baseline

Do not describe `271b210` as green or production-ready.

- `npm run verify`: passes (lint, TypeScript, 44 Vitest files / 239 tests, production build).
- `npm run test:e2e`: **fails — 3 failed, 5 passed** on the isolated production server at port 54321.
- No regression tests were added by the four N01–N18 repair commits; the Vitest total remains 239.
- Playwright isolation and removal of the committed report are complete.
- The transaction wrapper and best-score `GREATEST()` update are useful, but submission correctness and concurrency are not complete.
- Docker/PostGIS is unavailable on the current Windows host. That prevents local live DB evidence, not implementation of the harness or execution in CI.

Work in the order below. For every item: first reproduce with a failing behavioral test, make the smallest vertical fix, run the targeted test, and commit atomically. Do not mark an item complete from lint/typecheck/build alone.

## P0 — Restore a truthful green browser baseline

### N21 — Fix the Parkside MapLibre crash

`MapCanvas.tsx` adds `workspace-boundary` at effect initialization before the style is ready. MapLibre throws `Style is not done loading`, the Map error boundary replaces the canvas, and both Parkside journeys fail.

- Move boundary source/layer creation into the same style-ready/idempotent layer installation path as parcels and addresses.
- Reinstall it after `setStyle()` without duplicate-source/layer errors.
- Ensure all `addSource`, `addLayer`, `setLayoutProperty`, `setPaintProperty`, `setFilter`, and `queryRenderedFeatures` calls are guarded by both style readiness and relevant layer existence.
- Avoid an `idle` listener loop that can survive cleanup or register more than once.
- Add a focused component/browser regression proving a cold production load of Parkside retains its canvas and boundary layer.
- Done only when both `parkside-basemap.spec.ts` and `acceptance-journey.spec.ts` pass without suppressing page errors.

### N22 — Repair the stale workspace E2E fixture

`workspace.spec.ts` navigates to nonexistent `p1-sample-aerial` and expects the nonexistent title `Sample Aerial`.

- Use a canonical fixture exported by `PROJECTS`, preferably a stable seeded project suitable for the assertion.
- Authenticate if the route requires authentication; do not depend on state left by another test.
- Assert project identity, panels, and a live map canvas.
- Do not weaken the test to accept `Project not found`.

### N23 — Make the acceptance journey exercise the real store and real submission

The test references `window.__zustandStore`, but the app exposes `__vetroStore`; the optional checks allow it to silently submit an empty design. It calls `/api/grading`, not the transactional `/api/designs/submit` path it claims to verify.

- Expose one explicitly test-only store handle with a single name, or drive the UI.
- Create a deterministic design through the store/UI and assert it exists before submission.
- Submit through `/api/designs/submit`, reload the persisted attempt/progress, and validate it.
- Export the submitted immutable snapshot, not caller-supplied unrelated empty elements.
- Fail on any uncaught page error, console error, 401/403/404/409/500, or missing persisted identifier.

## P0 — Prevent design loss and stale overwrites

### N24 — Carry the restored revision into autosave

Workspace hydration loads `latest.data.elements` but discards `latest.id`. `useAutosave` therefore sends no `baseRevision` on the first save, bypassing conflict protection.

- Give the autosave controller an explicit hydration API/state that accepts elements plus the server revision.
- Do not arm autosave until hydration has completed, including the valid empty-design case.
- Reset hydration/revision state when `projectId` changes.
- Add tests for saved nonempty, saved empty, fixture fallback, project navigation, and first-edit stale conflict.

### N25 — Replace heuristic hydration dirty detection

The current `Object.keys(elements).length > 0` heuristic can treat stale Zustand state from a previous project as hydration, mark the real restored state dirty, and mishandle an intentionally empty design.

- Model hydration explicitly (`loading` → `hydrated`/`failed`) rather than infer it from element count.
- Clear or scope design state before loading a different project.
- Never autosave fixture/restored data merely because it was loaded.
- Preserve edits made after hydration and during an in-flight save.

### N26 — Implement an atomic compare-and-swap

The current API performs SELECT, optional comparison, INSERT, and cleanup as separate operations. Concurrent requests can both pass the comparison. Omitting `baseRevision` also disables the check.

- Require `baseRevision` after an existing working head has been observed; define an explicit create-only sentinel for a new design.
- Store a canonical mutable head/version separately from immutable checkpoints/submissions, or enforce the equivalent with a unique key and transactional row lock/version update.
- Perform compare, write, and retention in one transaction.
- Return a quoted standards-compliant `ETag` header and accept `If-Match` (a validated body version may remain only as a compatibility bridge).
- Add database concurrency tests: two writers from the same revision yield exactly one success and one 409; retrying a request cannot create an unintended duplicate.

### N27 — Correct retry and lifecycle behavior

- Track and clear retry timers on unmount/project change.
- Do not capture stale `elements` or `savedRevision` in retry closures.
- Permit a new edit after terminal error to return the state to dirty and start a new debounce.
- Make conflict state durable until explicit reload/merge/overwrite resolution.
- Remove the empty `beforeunload` handler or implement a supported authenticated keepalive strategy; do not call a no-op “best effort save.”
- Add fake-timer tests for edit-during-save, three retries/backoff, unmount, project switch, error recovery, and conflict.

### N28 — Make retention semantics real

The route comment says “upsert,” but it inserts every autosave and later deletes rows one at a time. String prefixes are being used to infer record type.

- Add an explicit snapshot kind (`working`, `checkpoint`, `submission`) and appropriate uniqueness/index constraints.
- Keep one mutable working head or a deliberately versioned autosave history; document which.
- Make checkpoints/submissions immutable and never subject to autosave retention.
- Delete retained versions set-wise inside the write transaction.

## P0 — Make authoritative submission correct

### N29 — Pass valid basemap features into grading

`loadParcels()` and `loadAddresses()` return loader result objects; submission passes those whole objects as `parcels` and `addresses`, unlike `/api/grading`, which uses the validated feature collections. It also silently grades without basemap data on any loader error.

- Reuse one authoritative server grading service from dry-run and submission.
- Pass the loader's validated features in the exact `DesignContext` shape.
- Treat missing required source data as an explicit `not_evaluated`/submission blocker, not a silent empty fallback.
- Remove `as never` casts by typing the request and grading inputs correctly.
- Add parity tests proving identical inputs/profile/source versions yield identical dry-run and submission checks, gates, and scores.

### N30 — Add idempotent and concurrency-safe submissions

`max(attempt)+1` inside a transaction is still racy, and the schema has no demonstrated unique attempt constraint.

- Require an idempotency key per submission action and persist its response/result.
- Add a unique constraint for the intended attempt identity and allocate attempt numbers safely under concurrency.
- Ensure duplicate delivery returns the original submission rather than creating another snapshot/grade/attempt.
- Add real DB tests with concurrent requests and forced failures after each transaction step.

### N31 — Preserve progress using the same pass policy

- Centralize pass determination, including mandatory gates, and use it in grading, submission, progress, competency evidence, and UI.
- Preserve `completedAt` once passed and never regress status on a lower later score.
- Scope the progress read by `orgId` as well as user/project.
- Ensure best-score and pass-state updates are concurrency-safe, not based on a stale pre-read.

## P1 — Finish security and validation

### N32 — Complete restore validation

GET ownership is improved, but POST still parses raw JSON, accepts a caller-supplied `projectId`, and does not prove it equals the snapshot's project.

- Apply `RestoreSchema` with strict UUID/slug rules.
- Derive target project from the authorized snapshot unless an explicitly authorized copy workflow exists.
- Enforce tenant, assignment, role/capability, and project consistency for GET and POST.
- Add two-tenant and cross-project tests for students, instructors, admins, and invalid roles.

### N33 — Complete Zod coverage

Audit every path/query/body parameter, not only `request.json()` calls. At minimum finish checkpoints, conflicts, curriculum stages, export, restore, and all dynamic IDs/pagination/filter parameters.

- Reject unknown keys on security-sensitive mutation schemas.
- Bound array sizes, element counts, strings, coordinates, and export payloads.
- Return a consistent validation envelope and status.
- Add malformed JSON, wrong type, oversized payload, unknown key, and invalid identifier tests.

### N34 — Complete the capability matrix

- Define one server-side capability policy for student, instructor/reviewer, org admin, and platform staff.
- Apply it to review creation/resolution, checkpoints, conflicts, DWG approval, DWG status webhook, standards, competency writes, QA writes, redlines, analytics, and exports.
- Authenticate the DWG webhook with a signature and replay/timestamp protection; never trust a public job ID alone.
- Remove production `console.log`/`console.error` from DWG routes in favor of structured redacted logging.
- Test every sensitive endpoint across two tenants and all roles.

### N35 — Finish refresh-token invariants

The active membership and platform-staff claims are now loaded, but add integration evidence for user-disabled/deleted state, expired session, organization disabled state, simultaneous refresh, reuse after rotation, and audit failure behavior. Rotation must be atomic so two simultaneous refreshes cannot both succeed.

## P1 — Stop calling façades complete

### N36 — Inventory every route as persisted, computed, or unavailable

Re-audit competencies, QA, standards, reviews, redlines, notifications, optical budget, portfolio, analytics, checkpoints/conflicts, DWG, and export. For each route:

- If production data can be persisted and retrieved now, complete the repository/API/UI vertical slice and integration tests.
- If it is a deterministic computation, label it as such and prove inputs come from an authorized canonical snapshot.
- If neither is true, return `501 NOT_IMPLEMENTED` with a stable error code; remove fake success, fabricated IDs, and caller-supplied authoritative evidence.

### N37 — Build a real export artifact boundary

Object storage credentials are not required to implement this correctly.

- Introduce an object-store interface with local filesystem/in-memory test adapter and production S3/R2 adapter configuration.
- Build an actual ZIP (or declared archive type) containing validated GeoJSON, CSV/BOM, manifest, grading/source/profile versions, and checksums.
- Persist job state and artifact metadata; bind export to an authorized immutable snapshot.
- Stream or sign the artifact with expiry and tenant-safe keys.
- Test archive contents, checksum verification, expiration, cross-tenant denial, retry, and cleanup using the local adapter. Mark only live R2/S3 verification as externally blocked.

## P1 — Database evidence and schema truth

### N38 — Add an executable PostGIS test harness

Docker is absent on this host, but the repository and CI can still carry the harness.

- Add a pinned PostGIS service/container definition and CI job.
- Test both fresh install and upgrade from the last released schema.
- Reconcile every migration column/default/enum/nullability/index/FK with Drizzle metadata before running application tests.
- Add spatial insert, SRID rejection, validity, containment, nearest-neighbor, bbox, and `EXPLAIN` index-plan tests.
- Fail CI if migrations drift or the PostGIS extension/indexes are missing.
- Report local execution as unavailable and CI/staging execution separately; do not mark schema reconciliation complete until one real run passes.

### N39 — Add real route/database integration coverage

- Create deterministic two-tenant fixtures and reset them per test worker.
- Cover autosave/CAS/retention, checkpoint/restore/conflict, submit/progress, reviews/redlines/QA/competencies, notifications, standards, export jobs, and auth rotation.
- Assert persistence by reading back through a separate request/connection.
- Include transaction rollback and concurrency tests, not repository mocks.

## P1 — Truthful closure

### N40 — Replace stale status claims at the final SHA

Update `docs/chunk-reports/STATUS.md`, branch map, test taxonomy, API inventory, and relevant runbooks. Use separate columns for:

1. model/library present;
2. API exists;
3. persisted/canonical;
4. UI wired;
5. unit tested;
6. DB integration tested;
7. E2E/live verified;
8. production accepted.

Record exact command, exit status, test counts, environment, database/storage provider, artifact paths, and final SHA. A failed or unavailable gate remains failed/unavailable; it is not “blocked complete.”

## Required final gate

From a clean checkout at the final SHA:

1. Install with the lockfile.
2. Run lint and strict typecheck.
3. Run unit/component tests.
4. Run fresh and upgrade PostGIS migrations plus DB integration/security/concurrency suites.
5. Build the production app.
6. Run isolated Playwright with no reused server, no route interception for acceptance paths, and fail-on-page-error enabled.
7. Run the local object-store export suite and, when credentials exist, one staging provider smoke test.
8. Verify the tree is clean and generated reports/artifacts are ignored.

Do not resume chunks 101–200 until N21–N35 are complete and the full isolated Playwright suite is green. N36–N40 then establish whether broader product work may resume. Return commit-by-commit evidence and an honest remaining-risk list; do not return another blanket “all verified” summary.
