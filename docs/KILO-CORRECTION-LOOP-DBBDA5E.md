# Kilo Correction Loop After Audit of `dbbda5e`

## Stop condition

Do not add more chunks 101–200 until every P0 and P1 item below is fixed and independently evidenced. The current branch compiles and has 239 passing Vitest tests, but it is **not production-ready** and several “wired” features are non-persistent, insecure, untested through their real paths, or capable of losing work.

For each repair: prove the bug with a failing integration/E2E test, implement the smallest vertical fix, run targeted tests, run `npm run verify`, run the isolated Playwright suite, update the truthful status matrix, and commit atomically. Do not weaken checks or re-label a stub as an API implementation.

## Audit facts to preserve

- `npm run verify`: passes; 44 Vitest files, 239 tests.
- `npm run test:e2e`: fails 4/8 in the audited environment because Playwright reused an unrelated server on port 3000.
- Next build reports 61 total app routes, of which 56 are API routes—not 61 API routes.
- No new API route added in this work uses Zod despite `AGENTS.md` requiring validated inputs.
- No integration tests exercise the new autosave, checkpoint, conflict, restore, review, submission, competency, standards, QA, redline, notification, optical, or export routes against a database.
- `docs/chunk-reports/STATUS.md` is stale at SHA `1ef7ce6`, 222 tests, and 40 routes; it does not describe the current tree.
- The claim “7 dependencies removed” is false for the audited range: `package.json` and `package-lock.json` did not change from `dc694ef` to `dbbda5e`.

---

## P0 — Data integrity, database correctness, tenant security, privacy

### Repair A01 — Project slug versus UUID contract

**Problem:** UI/API callers send fixture slugs such as `p10-parkside-georgetown`, while `design_snapshots.project_id`, `grading_results.project_id`, `design_attempts.project_id`, and related Drizzle columns are UUID foreign keys to `projects.id`. Current autosave/submission/export inserts will fail on a real Postgres database.

**Required fix:** Establish one canonical external project identifier. Resolve slug to an organization-scoped database project UUID in a repository before every read/write, or intentionally migrate the schema to a stable text key with complete FK reconciliation. Do not cast slugs into UUID fields.

**Tests/evidence:** Real Postgres integration test using the Parkside slug; autosave, checkpoint, submit, progress, restore, grading, and export all persist and reload. Unknown, wrong-org, inactive, and unassigned projects must fail safely.

### Repair A02 — Reconcile SQL migrations and Drizzle schema

**Problem:** New migrations and `src/db/schema.ts` disagree materially:

- SQL uses PostGIS geometry while Drizzle still declares text.
- Parcel/premise/ROW/constraint enums differ between SQL and Drizzle.
- Review status values differ (`resolved`/`wont_fix` versus `resolved_by_*`).
- Notification type values differ.
- `review_comments.revision_id` nullability and `element_id` types differ.
- Numeric widths/percentages are modeled as integers in Drizzle.

**Required fix:** Choose the authoritative schema and make every migration, Drizzle declaration, repository, and API contract identical. Add a reconciliation migration; never edit already-applied history without a documented fresh-install policy.

**Tests/evidence:** Create a database from migrations 0001–latest; introspect and compare columns/types/checks/FKs/indexes; run representative Drizzle inserts/queries for every new table. Also test upgrade from the previous schema snapshot.

### Repair A03 — Test PostGIS for real

**Problem:** Migration 0005 adds parallel `geom` columns but does not backfill, constrain, synchronize, or expose them through Drizzle. Existing `geometry` columns vary between geography and text. GIST indexes may point at empty unused columns.

**Required fix:** Define authoritative geometry columns and SRIDs; backfill safely; validate geometries; update repositories to read/write them; remove or explicitly deprecate legacy columns through expand/contract migration.

**Tests/evidence:** Real PostGIS database tests for insert, bbox, containment, nearest-neighbor, transform, invalid SRID, and query plans using indexes.

### Repair A04 — Remove prohibited private parcel fields

**Problem:** `parcels.owner_name`/`ownerName` was added despite the WCAD provenance policy explicitly prohibiting owner data from student-facing fixtures and downstream storage.

**Required fix:** Remove owner-name storage unless a separately approved restricted administrative model and access policy exists. Add deny-list enforcement at intake, persistence, API serialization, logging, and export.

**Tests/evidence:** Import a fixture containing prohibited WCAD fields and prove they cannot enter database rows, APIs, logs, student UI, or exports.

### Repair A05 — Autosave must restore before save

**Problem:** Workspace always loads preloaded fixture elements, then marks them dirty and autosaves. It never fetches/restores the latest saved design first. Returning students can have saved work overwritten by fixture state.

**Required fix:** Add an explicit loading state: authorize project → fetch latest working revision → restore it, or initialize once from fixtures only if none exists → enable dirty tracking afterward. Never autosave during hydration.

**Tests/evidence:** Browser/database E2E creates edits, reloads, and proves exact restoration; an existing design is never overwritten by fixture initialization.

### Repair A06 — Autosave concurrency, retry, and unload safety

**Problem:** Edits during an in-flight save can be marked saved even though the response contains older state. Error state prevents later changes from scheduling another save. `sendBeacon` puts a token in JSON while authentication only accepts a bearer header, and there is no atomic ETag enforcement.

**Required fix:** Use revision/ETag compare-and-swap on the save itself; track a monotonically increasing local change version; if changes occur during save, remain dirty and resave. Add bounded retry/backoff and explicit retry UI. Use a supported authenticated unload strategy, but do not promise unload save as guaranteed.

**Tests/evidence:** Two-tab conflict E2E; edit-during-save; network failure/recovery; stale ETag 409; rapid edits; unload behavior documented without silent loss.

### Repair A07 — Snapshot ordering and retention

**Problem:** Autosave POST orders snapshots ascending while claiming to find the previous/latest revision. GET takes the first 20 ascending and calls the last one “latest,” which becomes wrong after 20 saves. Every debounce creates an unbounded immutable row.

**Required fix:** Use `desc(createdAt)` consistently; separate a mutable working head from named checkpoints/submitted immutable revisions, or implement safe compaction/retention.

**Tests/evidence:** More than 20 saves returns the actual latest; checkpoint/submission history remains immutable; retention cannot delete referenced revisions.

### Repair A08 — Close same-organization IDOR paths

**Problem:** Restore loads any snapshot in the same organization by ID without checking owner, assignment, project, or reviewer capability. Review routes allow any authenticated role to create/resolve arbitrary same-org comments. Several endpoints accept arbitrary student/revision IDs without authorization.

**Required fix:** Centralize resource authorization and require ownership/assignment/capability for snapshot restore, reviews, competencies, QA, DWG listing, instructor analytics, progress, curriculum stages, and exports.

**Tests/evidence:** Two users and two organizations attempt enumerate/read/write/restore/resolve/export operations across every new resource. Assert safe 403/404 behavior and no side-channel data.

### Repair A09 — Enforce role/capability semantics

**Problem:** Students can POST arbitrary competency records, self-evaluate QA approval, create/resolve review state, request any hint tier, and access DWG submission metadata. Authentication is being treated as authorization.

**Required fix:** Create an endpoint-capability matrix and call the existing authorization layer from each route. Student, instructor, admin, and support behavior must be explicit.

**Tests/evidence:** Table-driven allow/deny tests for every method on all 20 new/modified endpoints.

### Repair A10 — Zod validation and resource bounds

**Problem:** All new routes use untyped `request.json()` and casts. Large element/path/disposition arrays and malformed geometry can reach expensive engines or database JSON columns.

**Required fix:** Add shared Zod request/query/response contracts with strict objects, UUID/slug distinction, enums, geometry validation, finite numeric ranges, string limits, array/feature limits, and payload-size controls.

**Tests/evidence:** Contract tests cover malformed JSON, unknown fields, oversized arrays, NaN/Infinity, invalid coordinates, invalid enums, empty IDs, and boundary values.

### Repair A11 — Transactional authoritative submission

**Problem:** Submission creates snapshot, grade, attempt, and progress in separate operations. A mid-request failure leaves partial state. Concurrent submissions can choose the same attempt number. Best score is overwritten by a lower later score. Submission grading omits the basemap dataset used by `/api/grading`, so geometry-aware results can differ.

**Required fix:** Grade the canonical persisted revision with pinned project/check/profile/source versions, load authoritative basemap data, then atomically persist submission/grade/attempt/progress. Use a database uniqueness constraint or sequence for attempts and `max(previous, new)` for best score. Mandatory gates must match the grading endpoint.

**Tests/evidence:** Failure injection, duplicate idempotency key, concurrent submissions, lower-score retry, basemap-dependent checks, and historical reproducibility.

### Repair A12 — Refresh token preserves actual identity and role

**Problem:** Refresh always issues `role: "student"` and `email: ""`, breaking instructor/admin sessions and potentially capability behavior.

**Required fix:** Load active user and membership during refresh; reject disabled/revoked membership; issue current email, role, org, and platform-staff claims; retain reuse detection safely.

**Tests/evidence:** Student/instructor/admin refresh, role change, org removal, disabled user, replay, concurrent refresh, and session revocation.

---

## P1 — Replace fake/stub integrations with real vertical features

### Repair B01 — Competency evidence must be real

**Problem:** GET returns `records: []`; UI discards any records/results and hardcodes every competency to `developing` with zero evidence. POST trusts caller-supplied evidence and persists nothing.

**Required fix:** Derive/persist immutable evidence from authoritative submissions, checks, reviews, rationales, and assessor actions. UI renders server-assessed levels and links to evidence. Remove client fallback that disguises API failure as valid zero progress.

**Tests/evidence:** Submission/review creates evidence; UI reload shows correct levels; students cannot forge records.

### Repair B02 — QA checklist must be a workflow, not a list

**Problem:** UI only fetches static item definitions. POST evaluates caller-supplied dispositions, persists nothing, and has no reviewer authorization. It can report “approved” for arbitrary revision IDs.

**Required fix:** Persist revision-pinned checklist runs/dispositions, require reviewer capability, validate revision access, distinguish automated preflight and human dispositions, and expose edit/submit/return states in UI.

**Tests/evidence:** Real submit → reviewer checklist → return/approve → reload history journey.

### Repair B03 — Standards profiles must persist and govern rules

**Problem:** GET returns `profiles: []`; POST fabricates a timestamp ID and returns a profile without saving it. No project/check uses the result.

**Required fix:** Add reconciled schema/repository/API/UI for draft/publish/version/assign; wire the pinned profile into grading and constructability. Detect unresolved conflicts before publish.

**Tests/evidence:** Create two conflicting profiles, publish/assign independently, and prove different projects use their pinned values without retroactive mutation.

### Repair B04 — Redlines, observations, and changes must persist

**Problem:** POST returns ephemeral objects with `Date.now()` IDs; GET always returns empty arrays. No authorization, tenant resource check, revision anchoring, upload safety, or UI exists.

**Required fix:** Implement database tables/repositories, UUIDs, immutable revision anchors, role permissions, state transitions, map/UI workflow, and audit events—or remove the routes until implemented.

**Tests/evidence:** Create/list/disposition/reload and cross-tenant tests; map anchor remains tied to reviewed revision.

### Repair B05 — Notifications must use its existing table

**Problem:** Endpoint explicitly returns an empty stub despite a notifications schema/migration.

**Required fix:** Query tenant/user-scoped notifications, implement read/unread operations, generate outbox events from review/submission/invitation flows, and add idempotency.

**Tests/evidence:** Events create one notification, unread count changes, foreign users cannot read it, reload persists.

### Repair B06 — Tiered hints need progressive policy and evidence

**Problem:** Any authenticated caller can request any tier directly. Hint use/cost/mastery is not persisted; UI always requests tier 1 and displays plain text.

**Required fix:** Validate failed check against the caller’s canonical design, enforce tier progression/policy, persist reveal events and costs, return next eligibility, and expose the progression in UI.

**Tests/evidence:** Direct tier skipping fails; repeated request is idempotent; usage persists and affects configured evidence/score only as policy states.

### Repair B07 — Optical budget must derive from canonical design

**Problem:** API calculates caller-supplied arbitrary paths with no project/revision/profile relationship, no array bounds, and no UI.

**Required fix:** Build paths server-side from persisted topology/fibers/components and pinned standards/catalog; expose path contributions and worst-path UI. Reject missing engineering inputs as not-evaluated/blocking rather than inventing defaults.

**Tests/evidence:** Independent numeric fixtures plus real design → optical tab → reload/export journey.

### Repair B08 — Export a real immutable package

**Problem:** “Full package” endpoint trusts unsaved client elements, calls `buildBOM` with the wrong shape, returns JSON rather than an archive, stores metadata as a design snapshot, and UI only shows an `alert`. The UI hardcodes Parkside for every project. CSV has no escaping/formula protection.

**Required fix:** Export a selected authorized persisted revision; derive BOM through real placements/catalog; produce a downloadable archive containing GeoJSON, safe CSV, manifest, checksum, version/provenance metadata, and later LLD artifacts. Use an export/job table or object storage, not design snapshots. Pass actual workspace project ID.

**Tests/evidence:** Download/unzip/validate contents; checksum reproducible; quotes/newlines/formulas safe; cross-tenant download forbidden; export matches revision exactly.

### Repair B09 — Curriculum stage authority must use persisted progress

**Problem:** Stage endpoint uses library defaults and appears not to load assignment, curriculum version, student progress, or tenant project access. Tool gating is a POST advisory and the actual drawing tools can bypass it.

**Required fix:** Resolve assigned published curriculum and progress server-side; enforce stage/tool gates on mutations, not only UI; pin versions.

**Tests/evidence:** Direct API/store attempts cannot create locked-stage elements; progression persists and differs by assignment version.

### Repair B10 — Constructability source truth

**Problem:** UI always passes `new Set(["parcels"])`, claiming parcel source availability even if basemap data failed. It runs client-side against potentially partial data and is not reconciled with server grading.

**Required fix:** Derive available approved source types from actual loaded/persisted data; run authoritative rules server-side for submission; share rule definitions/evidence with live UI; show not-evaluated when data is missing.

**Tests/evidence:** Missing/failed/unapproved parcel source cannot silently become evaluated; UI/server outcomes match.

---

## P1 — Verification and documentation truth

### Repair C01 — Isolated Playwright server

**Problem:** `reuseExistingServer` accepted an unrelated Next.js app on port 3000. The suite failed 4/8 and can produce false results depending on what owns the port.

**Required fix:** Use a unique configurable test port, start the VETRO production build or isolated dev server, add a health/build identity check, and never reuse an arbitrary process. Seed a dedicated test database/tenant deterministically.

**Tests/evidence:** Run all Playwright tests twice from a clean environment. Assert the app identity/commit and record server logs/traces on failure.

### Repair C02 — Add real API/database integration coverage

**Problem:** The 17 additional tests are almost entirely pure library tests. New routes and UI integrations are untested.

**Required fix:** Add database-backed route tests for auth, validation, tenant isolation, persistence, conflicts, transactions, and history. Add component tests for autosave hydration/races, competency evidence, QA workflow, hints, optical, and export errors.

**Tests/evidence:** Demonstrate each critical test fails against `dbbda5e` before passing on the fix.

### Repair C03 — Make CSP meaningful

**Problem:** CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts, undercutting the claimed hardening. HSTS is also emitted in local/non-HTTPS contexts.

**Required fix:** Use nonces/hashes and environment-appropriate headers; retain only documented MapLibre/Next.js requirements; add report-only rollout if necessary.

**Tests/evidence:** Production header tests and browser smoke tests with no CSP violations or broad unsafe script policy.

### Repair C04 — Correct the status matrix and metrics

**Problem:** Status document is stale and violates its own tier definition. It labels pure libraries as `api`, references old SHA/counts, and still describes now-changed features as missing. Commit/summary route counts conflict.

**Required fix:** Re-audit every row at the current SHA. Separate library, route exists, persisted, UI wired, integration tested, live verified, and production accepted. Correct route/dependency/file metrics.

**Tests/evidence:** Every status claim links to current files/tests/live evidence; stubs remain `library` or `absent`, not `api`.

### Repair C05 — Final correction acceptance gate

Run from a clean checkout and fresh real Postgres/PostGIS database:

1. Apply every migration in order and compare to Drizzle schema.
2. Seed two organizations, roles, Parkside project/source data, and assignments.
3. Run cross-tenant and role matrix.
4. Login, restore or initialize, edit, autosave, reload, conflict, checkpoint, submit, grade, progress, hint, QA review, revise, optical, and export.
5. Verify privacy deny-list, audit events, notifications, immutable revisions, exact export contents, and historical version pins.
6. Run lint, typecheck, all Vitest/integration tests, production build, isolated Playwright, and migration tests.

Do not claim production readiness if any step uses a dev bypass, local fixture fallback for persistence, mocked database, caller-supplied authoritative score/path/evidence, or manual database repair.

## Required final response

Return commits by repair ID; exact test/build/E2E/migration results; real database version; schema diff result; endpoint-capability matrix; cross-tenant evidence; autosave data-loss proof; live journey artifacts; updated status matrix; and remaining blockers. If something remains a stub, call it a stub.
