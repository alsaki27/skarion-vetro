# Chunk Status Matrix — feat/50-chunk-recovery

Generated: 2026-07-11. Status = `implemented` / `partial` / `absent`.

Judged by files present **on the recovery branch** (baseline from `feat/30-chunk-gis-platform` + 10 real recovery commits + 1 anti-gate commit). Commit messages are not evidence.

| Chunk | Title | Status | Wired into app? | Evidence |
|-------|-------|--------|-----------------|----------|
| 1 | Test framework, CI, verification | implemented | yes | `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `.env.example`, `src/lib/*.test.ts` (29 test files, 110 tests) |
| 2 | Close critical security gaps | partial | partial | `src/lib/auth/security.test.ts`, `src/app/api/projects/[id]/route.ts` has auth guard; missing: `/api/dev/seed` not removed, LLD dev override removed from `SidePanel.tsx` ✓ |
| 3 | Persistent invitations, sessions | partial | partial | `src/app/api/auth/refresh/route.ts`, `src/app/api/auth/logout/route.ts`, `src/db/schema.ts` has `authSessions`/`organizationInvitations` tables; missing: invites use in-memory fallback, refresh token reuse detection untested |
| 4 | App shell, capability auth | partial | partial | `src/lib/auth/capabilities.ts` + test, `/login`, `accept-invite`, `access-denied` pages, `OrgSwitcher.tsx`; missing: routes don't all call `authorize()`, platform support mode |
| 5 | PostGIS schema baseline | partial | no | `src/db/schema.ts` has full schema with `org_id` NOT NULL on new tables; missing: PostGIS geometry columns (still text), GIST indexes, reconciliation migration |
| 6 | Repository/service layer | partial | partial | `src/lib/db/tenant-context.ts`, `project-repository.ts`, `design-repository.ts`, `repositories.test.ts`; missing: most route handlers still call `getDb()` directly |
| 7 | Observability, audit, health | partial | partial | `src/app/api/health/live/route.ts`, `health/ready/route.ts`, `src/lib/logging.ts`, `src/lib/audit.ts`; missing: audit hooks not wired into routes |
| 8 | Engineering workspace shell | implemented | yes | `src/app/workspace/[projectId]/page.tsx`, `ErrorBoundary.tsx`, `use-panel-state.ts`, `use-keyboard-shortcuts.ts`, panel persistence |
| 9 | Virtualized attribute table | partial | partial | `src/components/workspace/BottomPanel.tsx` now virtualizes rows, supports sort/filter, CSV export, and bi-directional selection sync with basemap features; missing: server-side sort/filter/pagination and shared backend table endpoint |
| 10 | Symbology, labels, legends | partial | partial | `src/lib/styles.ts` with defaults, `StyleEditor.tsx`, `Legend.tsx`; missing: no schema/migration for `layer_styles`, no rule validation rejecting raw expressions, labels not applied to map |
| 11 | Global search & measure | partial | partial | `src/app/api/search/route.ts` for roads+addresses, `src/components/workspace/WorkspaceTopBar.tsx` has search input; missing: measure tool, coordinate readout, typeahead UI |
| 12 | (not in plan — was placeholder) | absent | no | Chunk 12 in the 50-chunk plan = symbology (same as 10). Plan's chunk 13 = global search. The plan renumbered. |
| 13 | (was symmetry placeholder) | absent | no | Same as above — the 50-chunk plan's actual numbering: 8=shell, 9=layers, 10=inspector, 11=table, 12=symbology, 13=search |
| 14 | Study areas & county selector | implemented | yes | `src/app/api/study-areas/route.ts`, `src/lib/study-areas.test.ts`, `StudyAreaSelector.tsx`, census endpoint |
| 15 | Data source registry | implemented | yes | `src/app/api/data-sources/route.ts`, `src/db/schema.ts` has `data_sources`/`data_source_versions`, provenance endpoint |
| 16 | ArcGIS discovery | implemented | yes | `src/app/api/discovery/search/route.ts`, `discovery/preview/route.ts`, `src/lib/discovery.test.ts` |
| 17 | File import pipeline | implemented | yes | `src/app/api/imports/upload/route.ts`, `src/lib/import-pipeline.test.ts`; missing: no background job runner |
| 18 | Import wizard & field mapping | implemented | yes | `ImportWizard.tsx`, `src/app/api/field-mapping-templates/route.ts`, `src/lib/field-mapping.test.ts` |
| 19 | Road centerline intelligence | implemented | yes | `src/lib/gis-intelligence.ts` (road/address normalization, dedup, serviceability) + test; `src/db/schema.ts` has `road_segments` |
| 20 | Address & premise intelligence | partial | partial | `src/db/schema.ts` has `address_points`, `src/lib/gis-intelligence.ts` has normalization/dedup; missing: building model, multi-source dedup policy, review queue |
| 21 | Parcel ingestion, linkage, privacy | partial | no | `src/lib/parcels.test.ts` has model; missing: actual `parcels` schema table, linking logic |
| 22 | ROW, easements, constraints | partial | no | `src/lib/constraints.test.ts` has classification model; missing: schema tables, official-vs-derived enforcement |
| 23 | Data quality, readiness gate | partial | no | `src/lib/quality-dashboard.test.ts` has quality model; missing: readiness gate in API, refresh diff computation |
| 24 | Versioned curriculum, cohorts | partial | no | `src/lib/curriculum-projects.ts`, `src/lib/lessons-model.ts`; missing: no DB-backed cohort/assignment tables, no published version immutability |
| 25 | Learning objectives, lessons | partial | no | `src/lib/lessons-model.ts` has concepts/objectives/mastery; missing: knowledge check scoring, answer server-side, lesson content |
| 26 | Authoritative stage engine | partial | no | `src/lib/hld-curriculum.ts` has stage definitions/gates; missing: server-side gate enforcement, tool registry per stage |
| 27 | HLD 01 basemap handoff | partial | partial | Existing DWG pipeline `src/app/api/dwg/status/route.ts`, `scripts/dwg-pipeline/`; missing: approval workflow, stage blocking |
| 28 | Design persistence, autosave | partial | partial | `src/lib/design-persistence.ts` has model + ETag conflict detection; missing: actual autosave endpoint, checkpoint storage |
| 29 | HLD 02: service groups | partial | no | `src/lib/service-groups.ts` + test; missing: UI workflow, lasso selection, group colors, rationale requirement |
| 30 | HLD 03: structures, containment | implemented | yes | Existing containment model (`src/lib/store.ts` hostInContainer, `HARDWARE_CATALOG`), `routes-model.ts` has structure catalog |
| 31 | HLD 03: typed physical routes | partial | no | `src/lib/routes-model.ts` has route types/endpoint validation; missing: route editing UI, cable-in-conduit occupancy |
| 32 | Constructability validation | partial | no | `src/lib/constructability.ts` has rule registry + source-aware validation; missing: most individual rules not wired, no issue↔map highlighting |
| 33 | HLD 04: closures, FDH topology | partial | no | `src/lib/topology.ts` has trace/orphan detection; missing: closure service set workflow, topology graph persistence |
| 34 | Server-authoritative grading | partial | partial | Existing `runGrading()` in `engine.ts`; missing: server-side execution with pinned versions, mandatory gates separate from scores |
| 35 | Cable model, fiber allocation | implemented | yes | `src/lib/fiber-engine.ts` with 12-color standard + allocation with overlap prevention; covered by `src/lib/lld-engines.test.ts` |
| 36 | Splice model, splice matrix | implemented | yes | `src/lib/splice-model.ts` with continuity tracing + matrix generation; covered by `src/lib/lld-engines.test.ts` |
| 37 | Deterministic numbering, schematic | implemented | yes | `src/lib/numbering-engine.ts` with graph-based numbering; covered by `src/lib/lld-engines.test.ts` |
| 38 | Label & callout engine | implemented | yes | `src/lib/label-engine.ts` with templates for cable/terminal/structure; covered by `src/lib/lld-engines.test.ts` |
| 39 | Splice diagrams | implemented | yes | `src/lib/splice-diagram.ts` with balance validation; covered by `src/lib/lld-engines.test.ts` |
| 40 | Bill of Materials | implemented | yes | `src/lib/bom-engine.ts` with catalog-driven quantity computation; covered by `src/lib/lld-engines.test.ts` |
| 41 | Instructor review workflow | partial | partial | `src/lib/instructor-review.ts` + test (comment model, resolve), `src/lib/hints-engine.ts`; missing: review queue UI, anchored comments, notifications |
| 42 | Tiered hints & reasoning | partial | no | `src/lib/hints-engine.ts` with 3-tier hint library; missing: hint tracking, mastery evidence, no API/UI wiring |
| 43 | Analytics & insight | partial | no | `src/lib/instructor-analytics.ts` with funnel calculation; missing: wired into API, replaces InstructorDashboard placeholder |
| 44 | Export packages, CAD handoff | partial | partial | `src/lib/export-package.ts` + test (manifest, layer grouping); missing: actual export endpoint, DXF generation |
| 45 | Portfolio & onboarding | absent | no | No portfolio generation, no onboarding tour, no certificate verification |
| 46 | Vector tiles, performance | partial | no | `src/lib/performance-budgets.ts` with budgets + tile configs; missing: vector tile server, load testing. Constants file ≠ vector tiles implemented. |
| 47 | Security hardening | partial | partial | `src/lib/auth/security.test.ts`, CI gates from Task 2; missing: dependency scanning in CI, CSP headers, full cross-tenant suite |
| 48 | Accessibility WCAG | partial | partial | `workspace-accessibility.spec.ts` basic test; missing: keyboard fallbacks for map, axe CI scan, color-blind palettes |
| 49 | Operations, DR, deployment | absent | no | No backup/restore drill, no deployment pipeline, no incident runbook |
| 50 | MVP acceptance scenario | absent | no | No end-to-end mega-journey, no launch checklist execution |

## Summary

- **Implemented:** 17 chunks (1, 8, 14, 15, 16, 17, 18, 19, 30, 35, 36, 37, 38, 39, 40, plus anti-gate)
- **Partial:** 25 chunks (2, 3, 4, 5, 6, 7, 9, 10, 11, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 41, 42, 43, 44, 46, 47, 48)
- **Absent:** 3 chunks (45, 49, 50 — plus renumbered 12/13 as noted above)

LLD fiber engine chunks (35-40) are **implemented** as library code with dedicated coverage in `src/lib/lld-engines.test.ts`. All six engines have real assertions.

Chunk 46 was downgraded from `implemented` to `partial` because `performance-budgets.ts` is a constants file, not a vector tile server.
Chunks 42-43 were downgraded from `implemented` to `partial` because the hint and analytics libraries have no API/UI wiring.
