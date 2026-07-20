# Chunk Status Matrix — feat/50-chunk-recovery

Generated: 2026-07-20. Canonical development branch. All claims traceable to files on `1ef7ce6`.

## Tier definitions

| Tier | Meaning |
|---|---|
| `absent` | No meaningful implementation exists |
| `library` | Pure TypeScript types, constants, models, or library code with no API/UI wiring |
| `api` | API endpoint exists, wired to database, tests cover behavior |
| `ui` | UI component wired into the workspace or app shell, visible to users |
| `verified` | Passes lint + typecheck + build + targeted behavioral tests + live-check |
| `production` | All above + live-checked on real infrastructure, documented, monitored, secured |

## Status matrix

| # | Title | Tier | Evidence |
|---|---|---|---|
| 1 | Test framework, CI, verification | **verified** | `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, 42 test files, 222 tests. Lint/typecheck/build all green. |
| 2 | Close critical security gaps | **api** | `src/lib/auth/security.test.ts`, auth guard in `/api/projects/[id]`. Missing: `/api/dev/seed` not removed, not all routes call `authorize()`. |
| 3 | Persistent invitations, sessions | **api** | `src/app/api/auth/refresh/route.ts`, `src/app/api/auth/logout/route.ts`, `src/db/schema.ts` has `authSessions`/`organizationInvitations`. Missing: in-memory invitation fallback, refresh token reuse detection. |
| 4 | App shell, capability auth | **ui** | `src/lib/auth/capabilities.ts` + test, `/login`, `accept-invite`, `access-denied`, `OrgSwitcher.tsx`. Missing: routes don't all call `authorize()`. |
| 5 | PostGIS schema baseline | **library** | `src/db/schema.ts` has schema with `org_id` NOT NULL. Missing: PostGIS geometry columns (text), GIST indexes, reconciliation migration. |
| 6 | Repository/service layer | **library** | `src/lib/db/tenant-context.ts`, `project-repository.ts`, `design-repository.ts`, `repositories.test.ts`. Missing: most routes call `getDb()` directly. |
| 7 | Observability, audit, health | **api** | `src/app/api/health/live/route.ts`, `health/ready/route.ts`, `src/lib/logging.ts`, `src/lib/audit.ts`. Missing: audit hooks not wired into routes. |
| 8 | Engineering workspace shell | **ui** | `src/app/workspace/[projectId]/page.tsx`, `ErrorBoundary.tsx`, `use-panel-state.ts`, `use-keyboard-shortcuts.ts`, panel persistence, LeftPanel tabs. |
| 9 | Virtualized attribute table | **ui** | `src/components/workspace/BottomPanel.tsx` (virtualized rows, sort/filter, CSV export, selection sync). `src/app/api/features/route.ts` (server-side pagination endpoint, Zod-validated). Missing: test covers only client-side array ops, not the API. |
| 10 | Symbology, labels, legends | **library** | `src/lib/styles.ts` defaults, `StyleEditor.tsx`, `Legend.tsx`. Missing: no `layer_styles` schema/migration, labels not applied to map, no rule validation rejecting raw expressions. |
| 11 | Global search & measure | **ui** | `src/app/api/search/route.ts` (roads+addresses), `WorkspaceTopBar.tsx` search input. Missing: measure tool, coordinate readout, typeahead UI. |
| 12 | Plan placeholder — symbology | **absent** | Chunk 12 in 50-chunk plan = symbology (duplicate of 10). Renumbering artifact. |
| 13 | Plan placeholder — search | **absent** | Chunk 13 in 50-chunk plan = global search (duplicate of 11). Renumbering artifact. |
| 14 | Study areas & county selector | **api** | `src/app/api/study-areas/route.ts`, `src/lib/study-areas.test.ts`, `StudyAreaSelector.tsx` (UI), census endpoint. |
| 15 | Data source registry | **api** | `src/app/api/data-sources/route.ts`, `src/db/schema.ts` (`data_sources`/`data_source_versions`), provenance endpoint. |
| 16 | ArcGIS discovery | **api** | `src/app/api/discovery/search/route.ts`, `discovery/preview/route.ts`, `src/lib/discovery.test.ts`. |
| 17 | File import pipeline | **api** | `src/app/api/imports/upload/route.ts`, `src/lib/import-pipeline.test.ts`. Missing: no background job runner, imports process synchronously in request handler. |
| 18 | Import wizard & field mapping | **ui** | `ImportWizard.tsx`, `src/app/api/field-mapping-templates/route.ts`, `src/lib/field-mapping.test.ts`. |
| 19 | Road centerline intelligence | **api** | `src/lib/gis-intelligence.ts` (normalization, dedup, serviceability) + test. `src/db/schema.ts` has `road_segments`. |
| 20 | Address & premise intelligence | **library** | `src/db/schema.ts` has `address_points`, `src/lib/gis-intelligence.ts` normalization/dedup. Missing: building model, multi-source dedup policy, review queue. |
| 21 | Parcel ingestion, linkage, privacy | **library** | `src/lib/parcels.test.ts` has model. Missing: `parcels` schema table, linking logic. |
| 22 | ROW, easements, constraints | **library** | `src/lib/constraints.test.ts` classification model. Missing: schema tables, official-vs-derived enforcement. |
| 23 | Data quality, readiness gate | **library** | `src/lib/quality-dashboard.test.ts` quality model. Missing: readiness gate in API, refresh diff computation. |
| 24 | Versioned curriculum, cohorts | **library** | `src/lib/curriculum-projects.ts`, `src/lib/lessons-model.ts`. Missing: DB-backed cohort/assignment tables, published version immutability. |
| 25 | Learning objectives, lessons | **library** | `src/lib/lessons-model.ts` (concepts/objectives/mastery). Missing: knowledge check scoring, answer server-side, lesson content. |
| 26 | Authoritative stage engine | **library** | `src/lib/hld-curriculum.ts` (stage definitions/gates). Missing: server-side gate enforcement, tool registry per stage. |
| 27 | HLD 01 basemap handoff | **api** | `src/app/api/dwg/status/route.ts`, `scripts/dwg-pipeline/`. Missing: approval workflow, stage blocking. |
| 28 | Design persistence, autosave | **library** | `src/lib/design-persistence.ts` (model + ETag conflict model). Missing: actual autosave endpoint, checkpoint storage. |
| 29 | HLD 02: service groups | **ui** | `src/lib/service-groups.ts` + test. `ServiceGroupPanel.tsx` (creation, deletion, MST sizing, 10-color palette). `MapCanvas.tsx` renders colored hulls. Missing: lasso/drag-select, rationale editing. |
| 30 | HLD 03: structures, containment | **ui** | `src/lib/store.ts` (hostInContainer, HARDWARE_CATALOG), `routes-model.ts` structure catalog. Containment operations in store. |
| 31 | HLD 03: typed physical routes | **library** | `src/lib/routes-model.ts` (TypedRoute interface, catalog). No UI, no test, no wired component. Bare type catalog. |
| 32 | Constructability validation | **library** | `src/lib/constructability.ts` (metadata-only stub: rules check source availability only, no geometry validation). No UI, no map highlighting. `constructability.test.ts` tests only the two modes. |
| 33 | HLD 04: closures, FDH topology | **ui** | `src/lib/topology.ts` + test (trace/orphan detection). `TopologyTrace.tsx` (upstream path visualization). Store has `closureServiceSets` state + actions. Missing: creation workflow, topology graph persistence. |
| 34 | Server-authoritative grading | **api** | `src/app/api/grading/route.ts` re-runs full check registry server-side. Mandatory gates (connectivity/compliance/capacity/trespass/unassigned_premise) separated from weighted score in response. DB persistence. Missing: pinned check versions per submission. |
| 35 | Cable model, fiber allocation | **api** | `src/lib/fiber-engine.ts` (12-color standard + allocation with overlap prevention). Covered by `src/lib/lld-engines.test.ts`. |
| 36 | Splice model, splice matrix | **api** | `src/lib/splice-model.ts` (continuity tracing + matrix generation). Covered by `src/lib/lld-engines.test.ts`. |
| 37 | Deterministic numbering, schematic | **api** | `src/lib/numbering-engine.ts` (graph-based numbering). Covered by `src/lib/lld-engines.test.ts`. |
| 38 | Label & callout engine | **api** | `src/lib/label-engine.ts` (templates for cable/terminal/structure). Covered by `src/lib/lld-engines.test.ts`. |
| 39 | Splice diagrams | **api** | `src/lib/splice-diagram.ts` (balance validation). Covered by `src/lib/lld-engines.test.ts`. |
| 40 | Bill of Materials | **api** | `src/lib/bom-engine.ts` (catalog-driven quantity computation). Covered by `src/lib/lld-engines.test.ts`. |
| 41 | Instructor review workflow | **library** | `src/lib/instructor-review.ts` + `instructor-review.test.ts` (comment model, resolve). `src/lib/hints-engine.ts`. Missing: review queue UI, anchored comments, notifications. |
| 42 | Tiered hints & reasoning | **library** | `src/lib/hints-engine.ts` (3-tier hint library). Missing: hint tracking, mastery evidence, API/UI wiring. |
| 43 | Analytics & insight | **library** | `src/lib/instructor-analytics.ts` (funnel calculation). Missing: wired into API, replaces InstructorDashboard placeholder. |
| 44 | Export packages, CAD handoff | **api** | `src/app/api/designs/export/route.ts` (GeoJSON FeatureCollection + SHA-256 checksum + BOM CSV via buildBOM()). Missing: DXF generation. |
| 45 | Portfolio & onboarding | **ui** | `WorkspaceTour.tsx` (6-step tour overlay). `PortfolioExport.tsx` (element count, BOM breakdown, JSON download). Missing: PDF export, certificate verification. |
| 46 | Vector tiles, performance | **library** | `src/lib/performance-budgets.ts` (budgets + tile configs). Missing: vector tile server, load testing. Constants file is not a vector tile implementation. |
| 47 | Security hardening | **library** | `src/lib/auth/security.test.ts`, CI gates. Missing: dependency scanning in CI, CSP headers, full cross-tenant suite. |
| 48 | Accessibility WCAG | **library** | `workspace-accessibility.spec.ts` basic test. Missing: keyboard fallbacks for map, axe CI scan, color-blind palettes. |
| 49 | Operations, DR, deployment | **absent** | No backup/restore drill, no deployment pipeline, no incident runbook. |
| 50 | MVP acceptance scenario | **api** | `e2e/acceptance-journey.spec.ts` — mega-test: login → render → grade → export. Assertions on sources, scores, gates, manifest, CSV. |

## Summary by tier

| Tier | Chunks | Count |
|---|---|---|
| `verified` | 1 | 1 |
| `api` | 3, 7, 14, 15, 16, 17, 19, 27, 34, 35, 36, 37, 38, 39, 40, 44, 50 | 17 |
| `ui` | 4, 8, 9, 11, 18, 29, 30, 33, 45 | 9 |
| `library` | 2, 5, 6, 10, 20, 21, 22, 23, 24, 25, 26, 28, 31, 32, 41, 42, 43, 46, 47, 48 | 20 |
| `absent` | 12, 13, 49 | 3 |

Note: Chunks 12 and 13 are 50-chunk plan renumbering placeholders (duplicate of 10 and 11 respectively). No actual work scope exists for them.

## Current verification (2026-07-20)

| Check | Result |
|---|---|
| Lint (ESLint) | 0 errors, 0 warnings |
| TypeScript (`tsc --noEmit`) | passed |
| Unit/Integration tests (Vitest) | 222/222 passed (42 test files) |
| Production build (`next build`) | passed (40 application/API routes) |
| `git diff --check` | passed |

## Branch consolidation

The recovery branch (`feat/50-chunk-recovery`, SHA `1ef7ce6`) is the canonical development line. See `docs/branch-map.md` for full divergence evidence.

**Superseded branches (do not merge wholesale):**
- `feat/parcel-basemap-intake` — 80 commits behind recovery, strict subset
- `feat/50-chunk-master-plan` — 56/55 divergent commits, earlier completion claims
- `feat/saas-learning-foundation` — 82/17 divergent commits
- `feat/30-chunk-gis-platform` — baseline merged at branch creation
- `horn-helium`, `noiseless-nerve`, `petal-honeydew` — Agent Manager worktrees, 82-92 behind recovery

## Deferred work (by tier)

### Library → API (needs endpoint wiring)
5 (PostGIS), 6 (repositories), 10 (symbology), 20 (address/premise), 21 (parcels), 22 (constraints), 23 (data quality), 24 (curriculum), 25 (lessons), 26 (stages), 28 (autosave), 31 (routes), 32 (constructability), 41 (instructor review), 42 (hints), 43 (analytics), 46 (vector tiles), 47 (security), 48 (accessibility)

### API → UI (needs UI wiring)
2 (security gaps UI), 3 (invitation UI)

### UI → verified (needs live-check and full test)
4, 8, 9, 11, 18, 29, 30, 33, 45

### Verified → production (needs ops, monitoring, hardening)
1 (CI pipeline hardening, Playwright in CI)

### Absent (needs full implementation)
49 (operations/DR/deployment), plus 100-chunk plan chunks 51-100
