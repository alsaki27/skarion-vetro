# Skarion-VETRO: 100-Chunk Production Completion Execution Prompt

> Give this entire file to the implementation agent. It is an execution contract, not a brainstorming document.

## Mission

Take Skarion-VETRO from its current recovery-branch state to a genuinely production-ready, multi-tenant OSP fiber-design training platform. Complete all 100 chunks below in order unless a dependency requires a documented reorder. Do not stop at scaffolds, type definitions, constants, mocked UI, placeholder tests, or commit-message claims. A feature is complete only when it is wired through the real application, covered by meaningful tests, exercised through its user-facing path, and documented honestly.

The canonical starting branch is `feat/50-chunk-recovery`. At the current audited baseline, `npm run verify` passes with 42 test files and 222 tests. Preserve that floor. The flagship acceptance project is `p10-parkside-georgetown`, backed by 554 WCAD parcels and 557 Williamson County address points.

## Non-negotiable operating loop

For every chunk, run this loop:

1. **Inspect:** Read `AGENTS.md`, the relevant source, tests, migrations, reports, and the applicable Next.js 16 guide under `node_modules/next/dist/docs/`. Never rely on remembered Next.js behavior.
2. **Prove the gap:** Identify the actual missing or broken user path. Record current evidence before editing. If the chunk is already complete, strengthen or verify it instead of fabricating work.
3. **Design narrowly:** State the files, schema/API contract, tenant boundary, failure modes, and test plan. Reuse existing dependencies and patterns.
4. **Implement vertically:** Complete database/domain/API/UI integration where applicable. Do not leave a library orphaned from the product.
5. **Test behavior:** Add tests that fail against the pre-change behavior. Prefer assertions on observable state and persisted data over snapshots or source-text checks.
6. **Verify locally:** Run targeted tests, then `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run relevant Playwright journeys for user-facing work.
7. **Live-check:** For map, auth, persistence, import, grading, export, and instructor flows, exercise the actual running production build through a browser or HTTP client with real authentication. Mocks alone are insufficient.
8. **Report:** Update the status matrix and add a chunk report with changed files, migrations, tests added, exact results, deferred items, and known limitations.
9. **Commit:** One intentional commit per chunk or tightly coupled atomic group. Never use empty, placeholder, or misleading commits.
10. **Re-evaluate:** Confirm the next chunk's assumptions against the code now present. Continue until the final launch gate passes.

## Safety and truthfulness rules

- Preserve user changes and inspect a dirty worktree before editing. Never use destructive reset/checkout commands.
- Do not merge `feat/50-chunk-master-plan` wholesale. Salvage individual code only after evidence-based comparison.
- Never weaken ESLint, TypeScript strictness, auth, tenant isolation, validation, or tests merely to make a gate pass.
- Never claim PostGIS, vector tiles, autosave, authorization, analytics, accessibility, observability, backups, or deployment are implemented when only models/constants/tests exist.
- No `any`, production `console.log`, inline `<style>`, direct DOM mutation of design state, or new dependency without documented necessity.
- All API inputs use Zod; all protected routes authenticate and authorize; all tenant data queries constrain `org_id` at the repository boundary.
- All state-changing APIs are idempotent where retries are plausible and produce audit events for security- or curriculum-significant changes.
- All migrations must have a forward path, rollback/mitigation notes, indexes, tenant constraints, and representative migration tests.
- External services must have timeouts, bounded retries with jitter, structured errors, and safe degraded behavior.
- Secrets never enter source, fixtures, logs, browser bundles, screenshots, or reports.
- Tests must not depend on execution order, public mutable services, or developer-only bypasses.
- Do not increase the test floor by counting vacuous assertions. Delete or rewrite tests that only assert constants, placeholders, or implementation text.
- If blocked by credentials or infrastructure, finish everything locally possible, add a reproducible operator procedure and verification command, mark only that external step blocked, and continue other chunks.

## Definition of production-ready

Production-ready means a new organization can be provisioned; an instructor can invite users, create and publish a versioned curriculum assignment, approve source data, and review submissions; a student can sign in, resume an autosaved project, complete gated HLD/LLD work on real GIS data, receive deterministic authoritative grading and hints, submit revisions, export a portfolio package, and recover safely from conflicts and transient failures. Tenant isolation, accessibility, observability, backups, deployment, incident response, and performance gates must be demonstrated—not inferred.

---

## Phase 1 — Repository truth, baseline, and delivery discipline

### Chunk 001 — Canonical branch and worktree reconciliation

- **Implement:** Inventory every local/remote branch and worktree; identify unique commits; designate `feat/50-chunk-recovery` as canonical; document branches that are superseded, archival, or candidates for selective salvage. Remove unrelated CRM/Talentos plan files from VETRO scope without deleting user work.
- **Verify:** Produce `git rev-list --left-right --count` evidence for divergent branches and confirm the canonical tree contains the real-data Parkside workflow and all 222 baseline tests.
- **Done when:** One branch map exists in `docs/`, no ambiguous “main implementation” remains, and future work targets only the canonical branch.

### Chunk 002 — Truthful status matrix

- **Implement:** Re-audit all status rows against actual code and reachable user paths. Separate `model/library`, `API wired`, `UI wired`, `live verified`, and `production ready` instead of one vague status.
- **Verify:** Every claim links to concrete files/tests/routes; later recovery commits are reflected; duplicate/renumbered chunks are normalized.
- **Done when:** `docs/chunk-reports/STATUS.md` is current, internally consistent, dated, and contains no claim based only on a commit message.

### Chunk 003 — Documentation reconciliation

- **Implement:** Correct README project counts, tables, routes, test counts, auth status, setup instructions, environment variables, and architecture. Add a documentation ownership/update checklist.
- **Verify:** Markdown lint or equivalent structural checks pass; every documented command works from a clean checkout; links resolve.
- **Done when:** A new developer can set up, test, and understand the current system without discovering stale statements.

### Chunk 004 — Clean verification baseline

- **Implement:** Ensure `npm run verify` deterministically performs lint, typecheck, unit/integration tests, and production build from a clean tree. Prevent stale `.next` artifacts from breaking standalone typecheck.
- **Verify:** Run twice after deleting only generated build output; both runs pass. Preserve or exceed 222 meaningful tests.
- **Done when:** Local and CI verification use the same documented commands and produce stable results.

### Chunk 005 — Test taxonomy and quality audit

- **Implement:** Classify tests as unit, integration, component, contract, migration, security, and E2E. Replace shallow placeholder/source-string tests with behavioral assertions. Define naming and fixture conventions.
- **Verify:** Generate a test inventory and identify coverage for each critical journey; mutation/manual pre-fix checks demonstrate key tests can fail.
- **Done when:** Test counts reflect useful behavior and every release-critical domain has an assigned test layer.

### Chunk 006 — CI pipeline hardening

- **Implement:** Build a GitHub Actions pipeline with dependency caching, lint, typecheck, unit/integration tests, migration validation, production build, Playwright, security scan, and artifact retention. Cancel superseded runs.
- **Verify:** Run on pull requests and protected branches; deliberately broken lint/test/build changes fail the correct job.
- **Done when:** No merge can bypass required green gates and logs/artifacts are useful for diagnosis.

### Chunk 007 — Commit and change-report gate

- **Implement:** Enforce meaningful commit messages, chunk reports, migration notes when schema changes, and test-floor updates. Keep hooks optional locally but authoritative in CI.
- **Verify:** Fixtures prove empty/placeholder reports and misleading completion claims are rejected.
- **Done when:** Each production chunk leaves an auditable evidence trail without relying on agent prose.

### Chunk 008 — Environment contract

- **Implement:** Centralize server/client environment parsing with Zod, distinguish required production variables from optional local variables, and prevent unsafe defaults in production.
- **Verify:** Tests cover missing, malformed, leaked client, and weak-secret configurations; production build fails early with actionable errors.
- **Done when:** `.env.example`, deployment docs, Worker config, and runtime validation agree.

### Chunk 009 — Dependency and license hygiene

- **Implement:** Remove unused packages, pin/lock dependencies appropriately, document required native binaries, and add vulnerability/license scanning with an exception process.
- **Verify:** Clean install succeeds; application/tests build without removed dependencies; scanner output is reviewed and gated by severity.
- **Done when:** The dependency graph is minimal, reproducible, and legally/operationally documented.

### Chunk 010 — Architecture decision records

- **Implement:** Add ADRs for platform boundary, Next.js versus Worker responsibilities, authoritative grading, tenant repositories, PostGIS, object storage, background jobs, and versioning.
- **Verify:** Current code conforms or deviations are entered as explicit migration work.
- **Done when:** Major architectural choices have durable rationale, consequences, and owners.

## Phase 2 — Database, PostGIS, repositories, and migrations

### Chunk 011 — Canonical production schema inventory

- **Implement:** Map every Drizzle table, SQL migration, relationship, enum, ownership rule, and missing database object. Reconcile migration numbering and schema drift.
- **Verify:** Generate schema from an empty database and compare it to expected Drizzle metadata.
- **Done when:** One ordered migration history can create the entire application database without manual patches.

### Chunk 012 — PostGIS enablement

- **Implement:** Add a migration enabling PostGIS and replace production geometry text columns with typed geometries using explicit SRIDs. Retain a safe conversion path for existing GeoJSON/text data.
- **Verify:** Migration tests insert, query, transform, and reject invalid-SRID geometries.
- **Done when:** Spatial data is natively queryable and no production path treats authoritative geometry as opaque text.

### Chunk 013 — Spatial indexes and query plans

- **Implement:** Add GIST/SP-GIST indexes for study areas, parcels, addresses, roads, constraints, and design geometry plus supporting tenant/composite indexes.
- **Verify:** Capture `EXPLAIN ANALYZE` for representative bbox, containment, nearest-feature, and tenant queries at realistic volume.
- **Done when:** Queries meet documented latency budgets and avoid sequential scans at target scale.

### Chunk 014 — Organization and membership integrity

- **Implement:** Enforce organization ownership, unique membership rules, role constraints, membership lifecycle timestamps, and safe deletion/retention semantics.
- **Verify:** Migration and repository tests cover duplicate membership, cross-org references, disabled organizations, and cascading behavior.
- **Done when:** Tenant ownership cannot become null, ambiguous, or cross-linked.

### Chunk 015 — Parcel, address, road, and building persistence

- **Implement:** Complete normalized tables for parcels, address points, road segments, premises/buildings, source versions, external identifiers, provenance, and serviceability state.
- **Verify:** Import real Parkside fixtures into a test database; prove durable identifiers, 554/557 counts, privacy exclusions, and deterministic linkage.
- **Done when:** Real basemap data no longer depends on repository files at runtime.

### Chunk 016 — ROW, easement, and constraint schema

- **Implement:** Add authoritative/derived constraint tables, source confidence, effective dates, geometry, review state, and provenance relationships.
- **Verify:** Tests prevent derived constraints from masquerading as authoritative and validate spatial overlap queries.
- **Done when:** Constructability rules can cite persisted, versioned source evidence.

### Chunk 017 — Curriculum, cohort, and assignment schema

- **Implement:** Persist curricula, immutable published versions, stages, lessons, objectives, cohorts, enrollments, assignments, due dates, and accommodations.
- **Verify:** Tests cover draft mutation, published immutability, cloning a new version, enrollment scope, and assignment visibility.
- **Done when:** Curriculum state survives deploys and is not encoded solely in TypeScript fixtures.

### Chunk 018 — Design revision and checkpoint schema

- **Implement:** Persist designs, immutable revisions, mutable working heads, checkpoints, element snapshots/deltas, version pins, authorship, ETags, and lifecycle state.
- **Verify:** Tests cover concurrent edits, revision ancestry, restore, checkpoint naming, and immutable submitted revisions.
- **Done when:** Every saved or submitted design has reconstructable history.

### Chunk 019 — Grading, attempts, mastery, and hints schema

- **Implement:** Persist submissions, grading engine/check versions, check results, mandatory gates, scores, attempts, hint usage, objective evidence, and mastery transitions.
- **Verify:** Regrading never mutates historical results; pinned versions reproduce prior output.
- **Done when:** Instructor analytics and student history derive from authoritative records rather than component state.

### Chunk 020 — Reviews, comments, notifications, and audit schema

- **Implement:** Persist review assignments, anchored comments, threads, resolution events, notifications, delivery state, and append-only audit events.
- **Verify:** Tests cover tenant scope, anchor validity, resolution permissions, unread counts, audit immutability, and retention.
- **Done when:** Review activity is durable, traceable, and queryable.

### Chunk 021 — Repository boundary completion

- **Implement:** Move direct route-level `getDb()` access into typed repositories/services with mandatory tenant context and transactions.
- **Verify:** Static search finds no unauthorized direct database access in protected routes; tests prove tenant context is required.
- **Done when:** Cross-tenant filtering cannot be forgotten by an individual handler.

### Chunk 022 — Transaction and idempotency patterns

- **Implement:** Define transaction boundaries for invitations, imports, autosave, submission, grading, review resolution, and exports. Add idempotency keys to retryable mutations.
- **Verify:** Tests replay requests and inject mid-transaction failures without duplicates or partial records.
- **Done when:** Network retries and worker restarts are safe.

### Chunk 023 — Seed and fixture strategy

- **Implement:** Separate deterministic test fixtures, local demo seed, and production bootstrap. Gate developer seed endpoints and prevent them from compiling/running in production.
- **Verify:** Production-mode tests prove seed endpoints are unavailable; local seed is repeatable.
- **Done when:** No development bypass can mutate a production deployment.

### Chunk 024 — Migration deployment and rollback discipline

- **Implement:** Add preflight checks, backups, expand/contract guidance, migration locks, compatibility windows, and rollback/forward-fix procedures.
- **Verify:** Exercise migrations from empty and previous representative schemas in CI.
- **Done when:** Schema releases can be deployed without guessing or prolonged downtime.

### Chunk 025 — Data retention and deletion

- **Implement:** Define retention for audit logs, sessions, imports, exports, submissions, and deleted organizations; implement soft delete/anonymization and legal deletion workflows.
- **Verify:** Tests ensure deletion never leaks or orphan-links tenant data and preserves required audit evidence.
- **Done when:** Operators can execute and prove retention/deletion policy.

## Phase 3 — Authentication, authorization, tenancy, and security

### Chunk 026 — Persistent invitation flow

- **Implement:** Remove in-memory invitation fallback; store hashed one-time tokens, expiry, inviter, role, organization, acceptance, and revocation.
- **Verify:** Tests cover replay, expiry, wrong organization, concurrent acceptance, revoked invite, and email enumeration resistance.
- **Done when:** Invitations work across restarts and multiple instances.

### Chunk 027 — Session and refresh-token rotation

- **Implement:** Persist refresh sessions, rotate tokens, detect family reuse, revoke compromised families, and expose safe logout-all behavior.
- **Verify:** Security tests exercise theft/replay, concurrent refresh, expiry, disabled user, and organization removal.
- **Done when:** A replayed refresh token cannot silently retain access.

### Chunk 028 — Secure browser session transport

- **Implement:** Prefer secure, HttpOnly, SameSite cookies or document the threat model for bearer storage; add CSRF protection where cookies mutate state.
- **Verify:** Browser tests prove login/logout/refresh across reload and reject CSRF/cross-origin attempts.
- **Done when:** Tokens are not exposed unnecessarily to application JavaScript and session behavior is consistent.

### Chunk 029 — Capability authorization everywhere

- **Implement:** Define capabilities for student, instructor, org admin, and platform support; call centralized authorization in every protected page/API/Worker handler.
- **Verify:** Generate an endpoint-capability matrix and table-driven allow/deny tests.
- **Done when:** Authentication alone never grants an operation.

### Chunk 030 — Cross-tenant isolation suite

- **Implement:** Build integration tests with two organizations covering projects, designs, layers, imports, grading, exports, reviews, analytics, and object keys.
- **Verify:** Attempt read/write/list/inference attacks across every resource type.
- **Done when:** CI fails on any cross-tenant data exposure, including counts and error-message side channels.

### Chunk 031 — Platform support mode

- **Implement:** Add explicit, time-limited, audited support impersonation with reason, approval policy, visible banner, and immediate revocation.
- **Verify:** Tests prove support access is impossible by default and every action retains original actor identity.
- **Done when:** Support can diagnose safely without hidden superuser behavior.

### Chunk 032 — API input/output validation

- **Implement:** Add Zod schemas to every API route and shared response contracts. Bound arrays, strings, geometry complexity, and upload metadata.
- **Verify:** Contract tests send malformed, oversized, unknown-field, and boundary-value payloads.
- **Done when:** No route trusts parsed JSON, query parameters, headers, or path IDs without validation.

### Chunk 033 — Security headers and browser policy

- **Implement:** Configure CSP, HSTS, frame-ancestors, MIME sniffing protection, referrer policy, permissions policy, and safe CORS.
- **Verify:** Production HTTP tests assert headers and CSP compatibility with MapLibre, fonts, tiles, and required APIs.
- **Done when:** Security headers are strict, documented, and do not require unsafe broad wildcards.

### Chunk 034 — Rate limiting and abuse controls

- **Implement:** Add tenant/user/IP-aware rate limits for login, invitations, imports, discovery, grading, exports, and expensive GIS queries.
- **Verify:** Tests validate thresholds, reset behavior, trusted proxies, headers, and fail-safe behavior if limiter storage is unavailable.
- **Done when:** Expensive/public endpoints resist brute force and resource exhaustion.

### Chunk 035 — File and archive security

- **Implement:** Validate magic bytes, filenames, zip traversal, decompression ratio, archive counts, size, geometry complexity, and supported formats; quarantine before processing.
- **Verify:** A malicious corpus covers zip bombs, traversal, polyglots, corrupt shapefiles, huge coordinates, and parser crashes.
- **Done when:** Untrusted files cannot escape storage boundaries or exhaust workers predictably.

### Chunk 036 — Secret and credential lifecycle

- **Implement:** Document secret generation, storage, rotation, least-privilege service credentials, and emergency revocation for Next.js, Worker, database, and object storage.
- **Verify:** Automated scans find no secrets; rotation is exercised in staging without downtime.
- **Done when:** No long-lived shared development credential is required in production.

### Chunk 037 — Audit event integration

- **Implement:** Emit structured audit events for auth, roles, data approval, imports, project publication, submissions, grading overrides, review resolution, exports, and support access.
- **Verify:** Integration tests verify actor, tenant, target, correlation ID, timestamp, before/after metadata, and failure behavior.
- **Done when:** Security- and learning-significant actions are reconstructable.

### Chunk 038 — Dependency and supply-chain security

- **Implement:** Enable lockfile integrity, automated vulnerability updates, provenance where available, code scanning, and protected workflow permissions.
- **Verify:** CI detects a seeded vulnerable dependency or unsafe workflow permission.
- **Done when:** Supply-chain findings have severity gates and an exception/expiry process.

### Chunk 039 — Threat model and security review

- **Implement:** Threat-model authentication, tenancy, GIS imports, grading integrity, object storage, exports, browser map, Worker callbacks, and instructor privileges.
- **Verify:** Map mitigations to code/tests and open tracked gaps with severity.
- **Done when:** High/critical threats are mitigated or explicitly block launch.

### Chunk 040 — Security acceptance gate

- **Implement:** Consolidate security tests, scanner results, headers, tenant isolation, rate limits, file corpus, and incident contacts into a release gate.
- **Verify:** Run against a production build and staging infrastructure.
- **Done when:** No unresolved critical/high finding exists and the signed checklist is archived.

## Phase 4 — Data intake, provenance, GIS quality, and performance

### Chunk 041 — Data-source registry completion

- **Implement:** Finish CRUD/approval/versioning UI and APIs for sources, licenses, update cadence, geographic scope, authoritative status, and provenance.
- **Verify:** Instructor/admin flows create, review, approve, supersede, and retire a source.
- **Done when:** Every map layer traces to an approved source version.

### Chunk 042 — ArcGIS discovery integration

- **Implement:** Wire catalog UI to real discovery/preview APIs with pagination, server-side filtering, timeout/retry, metadata inspection, and import handoff.
- **Verify:** Contract tests mock ArcGIS failures and a live/staging smoke test previews a known public source.
- **Done when:** “Coming soon” discovery UI is removed.

### Chunk 043 — Background import jobs

- **Implement:** Move heavy imports to a durable queue/worker with states, progress, heartbeat, retry, cancellation, deduplication, and dead-letter handling.
- **Verify:** Kill/restart workers mid-job; prove exactly-once visible results and recoverable failures.
- **Done when:** Request handlers never synchronously process production-sized GIS files.

### Chunk 044 — Field mapping and canonicalization

- **Implement:** Persist mapping templates by source/version, validate required targets and transforms, preview rows/geometries, and record mapping provenance.
- **Verify:** Import fixtures with renamed/missing/malformed fields and confirm deterministic canonical output.
- **Done when:** Operators can safely reuse and audit mappings without editing code.

### Chunk 045 — DWG ingest productionization

- **Implement:** Harden FastAPI/ODA conversion jobs, storage handoff, callbacks, control points, CRS detection, clipping, layer mapping, failure reports, and approval workflow.
- **Verify:** Corpus covers georeferenced and unreferenced DWG/DXF, bad units, title-block artifacts, wrong CRS, and converter failure.
- **Done when:** Approved output becomes a versioned basemap and stage gate input.

### Chunk 046 — Parcel/address/building reconciliation

- **Implement:** Link parcels, addresses, premises, and buildings across multiple source versions with durable external IDs, spatial fallback, confidence, and manual review queue.
- **Verify:** Parkside linkage remains deterministic; ambiguous and changed records enter review rather than silently merging.
- **Done when:** Demand counts are explainable and refresh-safe.

### Chunk 047 — Road and serviceability intelligence

- **Implement:** Persist normalized roads, aliases, ranges, side-of-street/serviceability attributes, and source conflicts; expose review UI.
- **Verify:** Tests cover normalization, duplicates, missing segments, and spatial association.
- **Done when:** Routing and premise eligibility use persisted reviewed intelligence.

### Chunk 048 — Data quality dashboard

- **Implement:** Surface completeness, duplicates, invalid geometry, CRS, linkage, source freshness, topology, privacy, and confidence metrics by layer/version.
- **Verify:** Seed known defects and confirm counts, drill-down, map highlighting, and export.
- **Done when:** An approver can understand why a dataset is or is not ready.

### Chunk 049 — Readiness gates and approval

- **Implement:** Define configurable mandatory data gates per curriculum stage; require authorized approval with comments and immutable evidence.
- **Verify:** Projects cannot advance using unapproved or failing data; override requires capability and audit event.
- **Done when:** Data quality is enforced server-side, not merely displayed.

### Chunk 050 — Source refresh and diff workflow

- **Implement:** Fetch/import new source versions, compute added/removed/changed features, assess impact on active projects, and require review before promotion.
- **Verify:** Synthetic source update produces correct spatial/attribute diff and preserves prior project pins.
- **Done when:** Refreshes never silently change an in-progress or submitted design.

### Chunk 051 — Privacy enforcement

- **Implement:** Encode allow/deny field policies per source, strip restricted attributes during intake, scan outputs/exports, and document public-record usage.
- **Verify:** Tests ensure WCAD owner, mailing, valuation, and restricted E911 fields never reach student APIs, logs, or artifacts.
- **Done when:** Privacy policy is machine-enforced end to end.

### Chunk 052 — Vector tile service

- **Implement:** Deliver authenticated tenant-scoped vector tiles for production-scale layers with versioned URLs, appropriate attributes, caching, and invalidation.
- **Verify:** Render large representative datasets and test tenant isolation, cache keys, zoom generalization, and stale-version behavior.
- **Done when:** “Vector tile configuration constants” are replaced by a working service.

### Chunk 053 — Geometry generalization and clustering

- **Implement:** Add zoom-dependent simplification, clustering, label density rules, and preservation of topology/critical detail.
- **Verify:** Visual and numeric tests compare feature counts, shape error, selection identity, and render performance by zoom.
- **Done when:** Maps remain readable and responsive without corrupting engineering geometry.

### Chunk 054 — GIS query API performance

- **Implement:** Add bbox/window queries, cursor pagination, server-side filter/sort, bounded nearest-neighbor search, and cancellation.
- **Verify:** Load tests cover realistic concurrent map pans, attribute-table queries, and global search.
- **Done when:** P95/P99 latency and database utilization meet published budgets.

### Chunk 055 — GIS data acceptance gate

- **Implement:** Run a complete Parkside source ingestion → quality → approval → tile/API → workspace render journey.
- **Verify:** Assert 554 parcels, 557 addresses, privacy rules, provenance, selection, search, and stable refresh behavior.
- **Done when:** The real-data flagship works from persisted production-like infrastructure, not file fallbacks.

## Phase 5 — Student workspace and design persistence

### Chunk 056 — Canonical project/workspace routing

- **Implement:** Remove obsolete project routes and hardcoded active-project allowlists; resolve published assignments to the workspace through server-authoritative access checks.
- **Verify:** Students see only assigned/released projects; deep links and invalid/retired versions behave correctly.
- **Done when:** Every reachable design experience uses one maintained workspace shell.

### Chunk 057 — Initial load and recovery states

- **Implement:** Add explicit loading, empty, unauthorized, unavailable-source, offline, and recoverable-error states around workspace/map/panels.
- **Verify:** Component/E2E tests inject each failure without crashing or losing edits.
- **Done when:** No blank canvas or ambiguous spinner masks a failure.

### Chunk 058 — Autosave service

- **Implement:** Debounced autosave through authenticated APIs with ETags, idempotency, dirty/saving/saved/error indicators, bounded retry, and unload handling.
- **Verify:** Browser tests edit, wait, reload, and recover identical state; transient failures retry without duplicate revisions.
- **Done when:** Student work survives refresh, navigation, process restart, and deployment.

### Chunk 059 — Conflict detection and resolution

- **Implement:** Detect stale ETags and present compare/reload/fork/merge-safe choices; never silently overwrite another session.
- **Verify:** Two-browser E2E creates a conflict and resolves it through every supported path.
- **Done when:** Concurrent editing has deterministic, user-visible semantics.

### Chunk 060 — Checkpoints and revision history

- **Implement:** Let users name checkpoints, inspect history, compare summaries, restore into a new working revision, and view submissions as immutable.
- **Verify:** Restore never mutates history and all actions persist/audit correctly.
- **Done when:** Students can safely experiment and recover.

### Chunk 061 — Offline/transient network resilience

- **Implement:** Queue bounded local changes during temporary disconnection, clearly show offline status, reconcile on reconnect, and protect against stale conflicts.
- **Verify:** Browser tests toggle network while editing and confirm no silent data loss.
- **Done when:** Temporary network loss is survivable and transparent.

### Chunk 062 — Map selection and inspector completion

- **Implement:** Ensure all reference/design feature types support hover, click, multiselect, keyboard traversal, provenance, attributes, relationships, notes, and map/table synchronization.
- **Verify:** E2E covers parcels, addresses, structures, routes, closures, and hosted equipment.
- **Done when:** No selectable entity falls back to a placeholder inspector.

### Chunk 063 — Attribute table backend integration

- **Implement:** Replace client-only full-data operations with tenant-scoped server pagination, sort, filter, column metadata, CSV streaming, and stable selection IDs.
- **Verify:** Large-data tests prove bounded memory, stable pagination, injection-safe filters, and selection sync.
- **Done when:** The table scales beyond fixture-sized datasets.

### Chunk 064 — Symbology and label persistence

- **Implement:** Persist validated style rules/templates, apply them to MapLibre layers, preview changes, enforce safe expression subsets, and version published styles.
- **Verify:** Reload preserves styles; invalid/raw expressions are rejected; labels render at configured zooms.
- **Done when:** StyleEditor affects the real map and survives sessions.

### Chunk 065 — Search, coordinates, and measure tools

- **Implement:** Complete typeahead global search, result categories, zoom/select behavior, coordinate readout/copy, distance/area measurement, units, snapping, and clear/reset.
- **Verify:** Tests cover keyboard operation, geographic/projected units, empty/error states, and map cleanup.
- **Done when:** The remaining workspace “global search & measure” gap is closed.

### Chunk 066 — Service-group workflow completion

- **Implement:** Persist lasso/rectangle selection groups, colors, rationale, capacity, assignment, editing, and validation against serviceable premises.
- **Verify:** E2E creates, edits, reloads, validates, and submits multiple groups without orphaned premises.
- **Done when:** HLD 02 is a complete guided workflow, not only store state.

### Chunk 067 — Structures and containment workflow

- **Implement:** Persist structure placement, hosting, capacity, nested containment, ejection, deletion cascades, attributes, and constructability issues.
- **Verify:** Tests cover every catalog structure, capacity edge, invalid host, undo/redo, autosave, and reload.
- **Done when:** HLD 03 structure design is durable and rule-driven.

### Chunk 068 — Typed physical route workflow

- **Implement:** Complete route draw/edit/split/merge, endpoint snapping, aerial/underground/duct/drop types, occupancy, bend/length rules, and live measurement.
- **Verify:** E2E covers valid and invalid endpoints, route reshaping, cable-in-conduit occupancy, undo/redo, and persistence.
- **Done when:** Route types have real engineering semantics beyond color/style.

### Chunk 069 — Topology and closure workflow

- **Implement:** Persist closure service sets, upstream/downstream connections, orphan detection, trace results, rerouting, and topology graph versions.
- **Verify:** Tests cover loops, disconnected elements, changed parentage, reload, and map-highlighted trace.
- **Done when:** HLD 04 topology is authoritative and reproducible.

### Chunk 070 — Constructability issue lifecycle

- **Implement:** Wire all applicable source-aware rules, issue severity, not-evaluated reasons, map↔panel highlighting, acknowledgements, fixes, waivers, and audit.
- **Verify:** Seed each rule outcome and confirm grading/gates consume the same authoritative result.
- **Done when:** Constructability is actionable, explainable, and consistent.

## Phase 6 — Curriculum, grading, LLD, review, and learning

### Chunk 071 — Curriculum authoring UI

- **Implement:** Instructor UI for project versions, stages, lessons, objectives, requirements, datasets, tools, gates, weights, thresholds, and preview.
- **Verify:** Create a draft curriculum without code changes and validate all references.
- **Done when:** Curriculum fixtures are seed/import inputs, not the only authoring mechanism.

### Chunk 072 — Publish/version workflow

- **Implement:** Validate and publish immutable curriculum/project versions; clone for edits; show dependency and active-assignment impact.
- **Verify:** Published content cannot mutate and existing students stay pinned while new assignments use the new version.
- **Done when:** Course changes are safe and auditable.

### Chunk 073 — Cohorts, enrollments, and assignments

- **Implement:** Instructor workflows for cohorts, enrollment, assignment dates, release conditions, due dates, accommodations, and status.
- **Verify:** Role/tenant tests and E2E cover assignment creation through student visibility.
- **Done when:** Real classes can be administered without database edits.

### Chunk 074 — Lesson and knowledge-check delivery

- **Implement:** Render stage lessons, objectives, examples, knowledge checks, server-side answer scoring, attempts, feedback, and progress.
- **Verify:** Correct answers are never shipped to the client before submission; attempt/mastery records persist.
- **Done when:** The platform teaches concepts rather than only grading drawings.

### Chunk 075 — Authoritative stage engine

- **Implement:** Resolve allowed tools, prerequisites, data approval, knowledge checks, design gates, and completion on the server using pinned curriculum versions.
- **Verify:** Direct API calls cannot bypass locked stages or tools.
- **Done when:** UI gating mirrors, but does not define, authority.

### Chunk 076 — Grading version registry

- **Implement:** Version checks, parameters, weights, mandatory gates, engine build, and project pins; validate registry references at publish time.
- **Verify:** Historical submissions reproduce results after later check changes.
- **Done when:** Deterministic grading is durable across releases.

### Chunk 077 — Server-authoritative grading execution

- **Implement:** Grade canonical persisted revisions server-side; ignore client-supplied derived scores; store complete check evidence and correlation IDs.
- **Verify:** Tampered client payloads cannot improve results; repeated grading of the same inputs/version is identical.
- **Done when:** The server is the sole submission authority.

### Chunk 078 — Gate-first result experience

- **Implement:** Clearly separate mandatory blockers, scored checks, not-evaluated checks, warnings, efficiency, actionable evidence, map highlighting, and next action.
- **Verify:** Accessibility/component/E2E tests cover pass, fail, partial-data, and server-error states.
- **Done when:** Students understand what failed and how to proceed without exposing answer keys.

### Chunk 079 — Submission and attempt lifecycle

- **Implement:** Validate, checkpoint, submit, grade, lock immutable revision, record attempt, update stage/mastery, and allow a new revision when policy permits.
- **Verify:** Transaction/idempotency tests prevent double attempts and partial submissions.
- **Done when:** Submission is atomic and auditable.

### Chunk 080 — Tiered hints and reasoning evidence

- **Implement:** Wire three-tier hints to check IDs/objectives, enforce progressive reveal/cost policy, persist usage, solicit reasoning where required, and protect instructor solutions.
- **Verify:** Tests cover eligibility, reveal order, reload, mastery impact, and authorization.
- **Done when:** Existing hint libraries drive the real learning experience.

### Chunk 081 — Cable and fiber allocation UI

- **Implement:** Connect persisted cables to allocation engine with count/tube/color display, reservations, overlap prevention, bulk operations, validation, and undo.
- **Verify:** E2E allocates multiple cables, detects conflicts, reloads, and reproduces the same state.
- **Done when:** The engine is fully operable without fabricated sample allocation.

### Chunk 082 — Splice matrix and continuity workflow

- **Implement:** Create/edit splice records at real closures, support pass-through/splice/spare states, validate continuity and balance, and trace circuits.
- **Verify:** Tests cover missing fibers, duplicates, invalid endpoints, splitters, reload, and generated matrix consistency.
- **Done when:** Splice outputs derive solely from persisted design data.

### Chunk 083 — Numbering, labels, and schematic workflow

- **Implement:** Generate deterministic numbering and labels, allow controlled overrides with reason, regenerate safely, and render/export schematics.
- **Verify:** Equivalent graphs produce stable output; topology changes yield predictable diffs.
- **Done when:** LLD documentation is repeatable and reviewable.

### Chunk 084 — BOM reconciliation

- **Implement:** Compute BOM from authoritative design/catalog versions, expose line-item provenance, compare revisions, flag unmapped equipment, and support instructor pricing policy separately.
- **Verify:** Every physical element contributes exactly as catalog rules specify; no fabricated quantities.
- **Done when:** BOM totals reconcile to design evidence.

### Chunk 085 — Instructor review queue

- **Implement:** Build tenant-scoped queue filters for cohort/project/stage/status/age/assignee, SLA indicators, assignment, and bulk navigation.
- **Verify:** E2E starts from a student submission and reaches the correct instructor queue item.
- **Done when:** Instructor review is discoverable and operational.

### Chunk 086 — Anchored review comments

- **Implement:** Create comments anchored to revision, element, map coordinate, check, or fiber row; support threads, resolution, reopen, mentions, and immutable historical context.
- **Verify:** Anchors survive later revisions and cannot cross tenant/design boundaries.
- **Done when:** Reviews communicate precisely without external tools.

### Chunk 087 — Notifications

- **Implement:** Add in-app notifications and pluggable email delivery for invitations, assignments, submissions, review comments, resolution, due dates, and job failures; include preferences and retries.
- **Verify:** Outbox/idempotency tests prevent duplicate sends; links authorize correctly.
- **Done when:** Users learn about required actions reliably.

### Chunk 088 — Instructor analytics

- **Implement:** Wire real attempts/mastery/hints/check failures into cohort funnel, struggle, time-to-completion, objective, and data-quality dashboards with drill-down.
- **Verify:** Known seeded cohort data produces independently calculated metrics and tenant-safe exports.
- **Done when:** Placeholder analytics are removed.

### Chunk 089 — Accessibility of learning and review flows

- **Implement:** Ensure lessons, grading, fiber tables, diagrams, comments, and analytics support keyboard, screen readers, focus management, reduced motion, and non-color cues.
- **Verify:** Automated axe plus manual keyboard/screen-reader checklist finds no serious/critical violations.
- **Done when:** WCAG 2.2 AA acceptance is documented for these flows.

### Chunk 090 — End-to-end curriculum acceptance

- **Implement:** Automate instructor publish/assign → student learn/design/hint/submit → server grade → instructor comment → student revise/pass.
- **Verify:** Run against production build with real database and Parkside data, without route interception or dev bypass.
- **Done when:** The complete learning loop passes repeatably.

## Phase 7 — Exports, operations, observability, accessibility, and launch

### Chunk 091 — Production export service

- **Implement:** Generate asynchronous, version-pinned export packages with GeoJSON, BOM CSV, splice matrix, schematic, manifest, provenance, checksum, and expiry.
- **Verify:** Validate archive contents against persisted revision and ensure authorization on creation/download.
- **Done when:** Existing export libraries are delivered through a durable production service.

### Chunk 092 — CAD/DXF handoff

- **Implement:** Produce documented DXF layers, units, CRS/control information, labels, blocks, and metadata; report unsupported constructs explicitly.
- **Verify:** Round-trip representative output through at least one independent DXF reader and visual render check.
- **Done when:** CAD export is a real artifact, not a manifest promise.

### Chunk 093 — Portfolio and certificate workflow

- **Implement:** Build student portfolio selection, redacted/public-safe artifacts, project narrative, verified completion record, share controls, and revocable certificate verification.
- **Verify:** Privacy/authorization tests cover private, organization, public-link, expired, and revoked states.
- **Done when:** Completed work can be presented safely and verified externally.

### Chunk 094 — Structured logging and tracing

- **Implement:** Add JSON logs, request/correlation IDs, trace context across Next.js/Worker/jobs, safe error taxonomy, redaction, and environment/release metadata.
- **Verify:** Trace a submission and import across services; tests prove secrets/PII are redacted.
- **Done when:** Operators can follow a failure without reproducing it locally.

### Chunk 095 — Metrics, dashboards, and alerts

- **Implement:** Instrument availability, latency, error rate, DB pool/query, queue lag, import success, autosave conflicts, grading duration, export duration, and browser errors; create actionable alerts.
- **Verify:** Synthetic failures trigger staging alerts with runbook links and deduplication.
- **Done when:** Service health and user-impacting degradation are visible.

### Chunk 096 — Backup, restore, and disaster recovery

- **Implement:** Configure database/object backups, retention, encryption, restore procedures, RPO/RTO, integrity verification, and regional/provider failure contingencies.
- **Verify:** Perform and document a staging restore including database, source versions, design revisions, and export references.
- **Done when:** Recovery has been timed and proven, not merely described.

### Chunk 097 — Deployment and rollback pipeline

- **Implement:** Create reproducible staging/production deployments for Next.js, Worker, jobs, migrations, and object storage with approvals, health checks, canary/smoke tests, and rollback/forward-fix controls.
- **Verify:** Deploy and rollback a harmless staging release while preserving active autosave compatibility.
- **Done when:** Releases require no undocumented dashboard clicking.

### Chunk 098 — Performance and capacity gate

- **Implement:** Define target tenants/users/features, browser budgets, API SLOs, job throughput, DB capacity, tile latency, and cost ceilings; optimize measured bottlenecks.
- **Verify:** Load-test concurrent students on Parkside-scale and larger datasets, including pan/search/autosave/grade/export.
- **Done when:** P95/P99 and resource usage meet signed budgets with headroom.

### Chunk 099 — Full accessibility and compatibility gate

- **Implement:** Complete WCAG 2.2 AA audit, keyboard map alternatives, color-blind-safe palettes, zoom/reflow, screen-reader semantics, reduced motion, and supported browser/device matrix.
- **Verify:** Automated and manual audits on Chrome, Edge, Firefox, Safari/WebKit, keyboard-only, and at least one screen reader; remediate serious findings.
- **Done when:** Accessibility and browser support reports contain no launch blockers.

### Chunk 100 — Production launch acceptance and handoff

- **Implement:** Run the entire clean-room journey: provision org → invite instructor/student → register/approve data → publish/assign curriculum → autosaved HLD/LLD design → authoritative grading/hints → review/revision/pass → export/portfolio → audit/analytics. Complete security, privacy, accessibility, performance, backup, deployment, support, incident, and rollback checklists.
- **Verify:** Use production builds and production-like infrastructure with no mocks, dev seed endpoints, local fixture fallback, route interception, or manual database edits. Capture artifact IDs, screenshots, traces, metrics, and exact commands. Run `npm run verify` and all Playwright projects one final time.
- **Done when:** All prior chunks meet their definitions; no critical/high security issue, P0/P1 defect, data-loss path, tenant leak, inaccessible blocker, undocumented operation, or dishonest status remains. Publish a signed launch report, operator runbook, architecture map, known-limitations list, and 30-day post-launch monitoring plan.

---

## Required final evidence package

Before declaring completion, produce:

1. Updated `README.md`, architecture docs, ADRs, API contracts, environment guide, and truthful status matrix.
2. Ordered migration set plus clean-database and upgrade-path results.
3. Endpoint/capability and tenant-isolation matrices.
4. Test inventory and exact lint/typecheck/unit/integration/E2E/build results.
5. Live flagship acceptance evidence for Parkside Georgetown.
6. Security threat model, scan results, exception register, and launch sign-off.
7. Accessibility and browser compatibility report.
8. Performance/load report with datasets, concurrency, P95/P99, failures, and cost observations.
9. Backup/restore drill and deployment/rollback drill reports.
10. Operations runbooks, dashboards/alerts list, incident contacts, and known limitations.

## Final agent response format

Do not answer with “all chunks complete” alone. Return:

- canonical branch and final commit SHA;
- chunks completed, partially completed, blocked, or already verified;
- exact verification command results;
- migrations and operational changes;
- live E2E evidence;
- unresolved risks ranked by severity;
- external/manual actions still required;
- links/paths to every evidence document.

If any definition of done is unmet, say the product is **not production-ready** and identify the exact blocking chunks. Truth is a deliverable.
