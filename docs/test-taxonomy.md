# Test Taxonomy — feat/50-chunk-recovery

Generated: 2026-07-20. 42 test files, 227 tests.

## Classification

| Tier | Count | Description |
|---|---|---|
| **Behavioral** | 28 files | Import and exercise real source modules with meaningful assertions. Provide genuine regression protection. |
| **Shallow** | 10 files | Test constants, self-defined logic, or trivial assertions. Little to no real module import. |
| **Placeholder** | 4 files | Test tautologies (`true === true`), wrong components, or only check `<body>` visibility. No regression protection. |

### Behavioral tests (28 files)

| File | Type | Coverage |
|---|---|---|
| `src/lib/store.test.ts` | Unit | Service group CRUD, multi-select, grading integration |
| `src/lib/api-client.test.ts` | Unit | authFetch: Authorization header, token handling |
| `src/lib/lld-engines.test.ts` | Unit | Fiber allocation, splice matrix, numbering, labels, BOM, splice diagram |
| `src/lib/service-groups.test.ts` | Unit | Group creation, premise assignment, capacity enforcement |
| `src/lib/style-schema.test.ts` | Unit | Zod schema validation for styles, colors, anti-injection |
| `src/lib/revisions.test.ts` | Unit | Revision increment, checkpoint linkage, submission scoring |
| `src/lib/instructor-review.test.ts` | Unit | Comment creation, state transitions by role |
| `src/lib/export-package.test.ts` | Unit | Manifest generation, checksum, layer grouping |
| `src/lib/constructability.test.ts` | Unit | Rule retrieval, source dependency validation |
| `src/lib/topology.test.ts` | Unit | Upstream trace, cycle detection, orphan/unconnected detection |
| `src/lib/hld-curriculum.test.ts` | Unit | Stage retrieval, advancement, blocking behavior |
| `src/lib/gis-intelligence.test.ts` | Unit | Road normalization, address dedup, serviceability classification |
| `src/lib/geometry/distance.test.ts` | Unit | Haversine distance, path length against real physical distances |
| `src/lib/grading/grading.test.ts` | Integration | Known-good/bad designs, gate logic, boundary containment, trespass |
| `src/lib/grading/containment.test.ts` | Integration | 5 containment rules + composite design |
| `src/lib/basemap-workspace.test.ts` | Unit | Feature labels, detection, search, parcel-address relations |
| `src/lib/basemap-routes.test.ts` | Integration | Next.js route handlers: auth, tenant isolation, feature counts |
| `src/lib/basemap-loader.test.ts` | Unit | Real fixture loading: 557 addresses, 554 parcels, 517 serviceable |
| `src/lib/projects/p10-parkside-georgetown.test.ts` | Integration | Fixture integrity, basemap linkage, trespass check |
| `src/lib/auth/capabilities.test.ts` | Unit | RBAC authorization by role and capability |
| `src/lib/auth/sessions.test.ts` | Unit | Token rotation determinism, family isolation |
| `src/lib/commit-gate.test.ts` | Unit | Placeholder pattern rejection, conventional commit acceptance |
| `src/components/MapCanvas.test.tsx` | Component | Style lifecycle, Strict Mode, basemap toggle, layer creation |
| `src/components/BasemapLayerControl.test.tsx` | Component | Rendering, visibility toggling via store |
| `src/components/ScoreCard.test.tsx` | Component | Null state, passing/failing scores, category breakdown, feedback |
| `e2e/acceptance-journey.spec.ts` | E2E | Full flow: login → render → grade → export |
| `e2e/parkside-basemap.spec.ts` | E2E | Real basemap rendering, source existence, feature counts |
| `e2e/workspace.spec.ts` | E2E | Workspace UI structure: header, panels, canvas |

### Shallow tests (10 files)

| File | Issue |
|---|---|
| `src/lib/types.test.ts` | 3 hardcoded boolean guards; tiny type coverage |
| `src/lib/quality-dashboard.test.ts` | All logic defined in test; no source imports |
| `src/lib/import-pipeline.test.ts` | All logic defined in test; no source imports |
| `src/lib/field-mapping.test.ts` | All logic defined in test; no source imports |
| `src/lib/data-sources.test.ts` | Tests `Array.includes()` on hardcoded list |
| `src/lib/premises.test.ts` | Multi-unit test is trivial create+length |
| `src/lib/discovery.test.ts` | Timeout test checks constant; no real discovery |
| `src/lib/study-areas.test.ts` | Empty state test checks `"".length` |
| `src/lib/attribute-table.test.ts` | Tests plain arrays; renders divs, not real component |
| `src/lib/db/repositories.test.ts` | Single test: instantiate + defined; no DB operations |

### Placeholder tests (4 files)

| File | Issue | Fixed? |
|---|---|---|
| `src/lib/auth/sessions.test.ts` | 2 of 3 tests were `true === true` tautologies | ✓ Fixed |
| `src/lib/commit-gate.test.ts` | Zero-file test was tautology; regex test was trivial | ✓ Fixed |
| `src/components/ScoreCard.test.tsx` | Rendered plain `div`, not actual ScoreCard component | ✓ Fixed |
| `e2e/workspace-accessibility.spec.ts` | Only checked `<body>` visibility and Tab key | ✓ Fixed |

## Critical test gaps

| Domain | Gap |
|---|---|
| **Auth** | No real token lifecycle test (signing, verification, expiry, refresh rotation) |
| **Database** | No CRUD operation tests; repository test only checks instantiation |
| **Grading HTTP** | No API route handler tests for `/api/grading` |
| **Drawing** | No test for user drawing operations (add points/lines, modify geometry) |
| **Concurrency** | No load or race condition tests |
| **Error recovery** | No test for API failure, partial network, corrupt data |
| **Cross-tenant** | No comprehensive tenant isolation suite |
| **Migrations** | No migration validation tests |

## Naming conventions

- **Unit tests**: `src/lib/<module>.test.ts` — test pure logic and library code
- **Component tests**: `src/components/<Component>.test.tsx` — test React components with @testing-library/react
- **Integration tests**: `src/lib/<module>.test.ts` (co-located) — test API routes with mocked auth and DB
- **E2E tests**: `e2e/<journey>.spec.ts` — test full browser workflows with Playwright
- **Fixture data**: Use project fixtures from `src/lib/projects/` for integration tests

## Fixture conventions

- Project fixtures live in `src/lib/projects/p<id>-<name>.ts`
- Real GIS data fixtures in `data/` directory
- Test-only fixtures defined inline in test files (avoid cross-test contamination)
- Basemap tests use `p10-parkside-georgetown` as canonical real-data fixture (554 parcels, 557 addresses)
