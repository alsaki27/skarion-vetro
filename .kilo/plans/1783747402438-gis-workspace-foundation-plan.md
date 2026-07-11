# Skarion VETRO — GIS Workspace Foundation Plan

**Date:** 2026-07-11  
**Scope:** Map-first GIS workspace shell, tenant-scoped layer/data-source model, county discovery, and safe import wizard.  
**What NOT included:** marketing polish, future projects (aerial/split/MDU/pole), LLD fiber splice tables, AutoCAD handoff, assignment/stage engine, analytics.

---

## Current State Snapshot

- **Framework:** Next.js 16, React 19, TypeScript 5, Tailwind v4, MapLibre GL, Zustand
- **Database:** Neon PostgreSQL, Drizzle ORM, multi-tenant schema (organizations, users, org_members, audit_log, cohorts, projects, network_elements, design_snapshots, grading_results, candidate_progress, basemap_templates/submissions/grades, ai_sessions/messages, lesson_chunks)
- **What exists:** Map canvas with drawing tools, basic Zustand store, hard-coded P1–P9 project fixtures, deterministic grading engine (13 checks), containment tree, simple side panel (Design/Score/LLD/Dashboard/Portfolio tabs), DWG ingest prototype, Hono Cloudflare Worker, JWT auth with dev fallback removed.
- **What does NOT exist:** layer system, data-source registry, feature inspector, attribute table, county discovery, import wizard, provenance tracking, study-area model, road/address/parcel entities.

---

## Chunk 1 — GIS App Shell Layout

**Goal:** Replace the current `project/[id]/page.tsx` toy layout with a proper engineering-grade map workspace.

### UI Scope
- New `src/app/workspace/[projectId]/page.tsx` route (or rename `project/` → `workspace/`).
- Desktop layout:
  ```
  ┌──────────────────────────────────────────────────────────────┐
  │ Project | Search | Stage | Save | Issues | User              │
  ├───────────────┬──────────────────────────────┬───────────────┤
  │ Layers        │                              │ Inspector     │
  │ Data Catalog  │          MAP                 │ Attributes  │
  │ Project       │                              │ Validation  │
  │ Issues        │                              │ Notes       │
  ├───────────────┴──────────────────────────────┴───────────────┤
  │ Attribute Table | Selection | Filters | Export | Statistics │
  └──────────────────────────────────────────────────────────────┘
  ```
- Top bar: project selector dropdown, global search input, stage badge, save state indicator, validation issue counter, user/role badge.
- Left panel: collapsible tabs (Layers, Data Catalog, Project, Issues) with resizable width.
- Right panel: selected-feature inspector with context-aware tabs.
- Bottom panel: attribute table, collapsible.
- Map stays in center, fills remaining space.
- Use CSS grid/flex with Tailwind. All panels `overflow-y-auto`.

### API Scope
- `GET /api/projects/:id` already returns safe DTO. No new API needed.

### Tests
- Playwright: navigate to workspace route, verify 4 panels visible, map canvas renders, top bar shows project title.
- Unit: workspace layout component renders without crash.

### Acceptance Criteria
- [ ] Opening `/workspace/p2-oakwood-underground` shows the 4-panel layout.
- [ ] Map canvas occupies the center and is interactive.
- [ ] Left, right, and bottom panels are visible and collapsible.
- [ ] Top bar shows project name and a search input.
- [ ] No console errors. Build passes. Lint passes.

---

## Chunk 2 — Layer Tree Panel (Left Sidebar)

**Goal:** Replace the simple tool palette with a real GIS layer tree.

### Schema Scope
New table `project_layers`:
```sql
id uuid pk, org_id uuid → organizations, project_id uuid → projects,
name text not null, layer_group text not null default 'proposed_network',
layer_type text not null, -- 'basemap' | 'reference' | 'proposed' | 'existing' | 'annotation'
source_id uuid → data_sources (nullable),
geometry_type text, -- 'point' | 'line' | 'polygon'
visible boolean default true,
opacity int default 100, -- 0-100
z_index int default 0,
style jsonb default {},
label_rules jsonb default [],
created_at, updated_at
```
Layer groups: Basemaps, Administrative, Parcels, Addresses, Roads, ROW, Existing Utilities, Environmental, Proposed Network, Reference/Annotation.

### UI Scope
- Left panel "Layers" tab: tree view with groups.
- Each layer: checkbox (visibility), opacity slider, z-order handle.
- Layer group headers are collapsible.
- Context menu: zoom to layer, rename, delete (reference layers only).
- Layer count badge per group.

### API Scope
- `GET /api/projects/:id/layers` — list layers scoped by `org_id` + `project_id`, ordered by `z_index`.
- `POST /api/projects/:id/layers` — create layer (instructor/admin only).
- `PATCH /api/projects/:id/layers/:layerId` — update visibility, opacity, z-index, style.
- `DELETE /api/projects/:id/layers/:layerId` — delete (instructor/admin only).

### Tests
- API integration: CRUD layer, tenant scoping, role gating.
- Playwright: toggle visibility, opacity slider changes map layer opacity.

### Acceptance Criteria
- [ ] Layer tree shows 10 default groups even when empty.
- [ ] Toggling visibility hides/shows the corresponding map layer.
- [ ] Opacity slider changes layer opacity on the map.
- [ ] Instructor can add a new layer; student cannot.
- [ ] Layer order (z-index) persists across reload (DB-backed).

---

## Chunk 3 — Feature Inspector Panel (Right Sidebar)

**Goal:** Replace the generic SidePanel with a context-aware feature inspector.

### UI Scope
- Right panel inspector tabs change based on selected feature type:
  - **Attributes** — key/value table of the selected element's attributes
  - **Relationships** — connected elements (graph neighbors)
  - **Containment** — hosted equipment (for containers)
  - **Connectivity** — reachable from CO? BFS summary.
  - **Capacity** — used vs max (for containers, cables)
  - **Validation** — per-feature grading issues
  - **Notes** — free-text notes per element
- Inspector stays open while map is visible (not a modal).
- Tab headers show status badges (e.g., "2 issues" on Validation tab).

### API Scope
- Reuses existing `designSnapshots` and network element data.
- `GET /api/elements/:id/relationships` — BFS neighbors from the grading engine's graph.
- `POST /api/elements/:id/notes` — save note to element attributes.

### Tests
- Playwright: select a pole → inspector shows Attributes + Connectivity tabs. Select a handhole → shows Containment + Capacity tabs.
- Unit: relationship graph computed correctly from `buildContext()`.

### Acceptance Criteria
- [ ] Selecting an element opens the inspector on the right.
- [ ] Inspector tabs are relevant to the selected element type.
- [ ] Containment tab shows hosted equipment with capacity bar.
- [ ] Validation tab shows any grading issues for this element.
- [ ] Notes can be saved and persisted in the design snapshot.

---

## Chunk 4 — Attribute Table Panel (Bottom)

**Goal:** Add a bottom attribute table for bulk feature viewing and editing.

### UI Scope
- Collapsible bottom panel with layer selector dropdown.
- Virtualized table (use `@tanstack/react-table` or native `<table>` with `overflow-x-auto` for training-scale data).
- Columns: field aliases, data types, sortable, filterable.
- Row click → zoom to feature on map + select in inspector.
- Multi-select checkboxes → bulk actions toolbar (hide, delete, export selected).
- Search/filter input above the table.

### API Scope
- `GET /api/layers/:layerId/features` — paginated features for a layer (use `network_elements` filtered by `element_type` mapped to layer).

### Tests
- Playwright: open attribute table, select "Poles" layer, click a row → map zooms to that pole.
- Unit: table renders with correct column count for selected layer.

### Acceptance Criteria
- [ ] Bottom panel shows a table of features for the selected layer.
- [ ] Clicking a row selects the feature and zooms the map.
- [ ] Sorting and filtering work client-side (training-scale data).
- [ ] Multi-select enables bulk hide/delete.
- [ ] Panel can be collapsed/expanded.

---

## Chunk 5 — Study Area Model (State/County Selection)

**Goal:** Enable choosing a geographic study area using Census boundaries.

### Schema Scope
New tables:
```sql
study_areas:
  id uuid pk, org_id uuid → organizations, project_id uuid → projects,
  name text not null,
  state_fips text not null, -- 2-digit
  county_fips text, -- 3-digit (county equivalent)
  county_name text,
  state_abbrev text,
  bbox jsonb not null, -- [west, south, east, north]
  geometry text not null, -- PostGIS polygon
  crs_preference text default 'EPSG:4326',
  created_at, updated_at

administrative_areas:
  id uuid pk, org_id uuid, study_area_id uuid → study_areas,
  area_type text not null, -- 'state' | 'county' | 'municipality' | 'census_tract'
  name text not null,
  fips_code text,
  geometry text not null,
  source text not null, -- 'census_tiger' | 'user_upload' | 'arcgis'
  source_url text,
  source_date timestamp,
  created_at
```

### API Scope
- `GET /api/study-areas` — list study areas for the org.
- `POST /api/study-areas` — create from state/county selection.
- `GET /api/study-areas/:id` — get with bbox and geometry.
- `GET /api/census/counties?stateFips=XX` — proxy to Census TIGER/Line county boundary catalog (static seeded data or fetched from Census API).

### Tests
- API: create study area, verify bbox is populated, verify tenant scoping.
- Playwright: county selector dropdown populates from seeded Census data.

### Acceptance Criteria
- [ ] Student can select a state from a dropdown.
- [ ] County dropdown populates based on selected state.
- [ ] Creating a study area stores FIPS, name, and bounding box.
- [ ] Map zooms to the study area bounding box on selection.
- [ ] Study area is tenant-scoped (students from other orgs cannot see it).

---

## Chunk 6 — Data Source Registry Schema

**Goal:** Foundation tables for tracking every external and imported data source.

### Schema Scope
New tables:
```sql
data_sources:
  id uuid pk, org_id uuid → organizations,
  name text not null, source_type text not null, -- 'arcgis_featureserver' | 'shapefile' | 'geojson' | 'kml' | 'census_tiger' | 'overture' | 'openaddresses'
  publisher text not null,
  service_url text,
  description text,
  license text,
  attribution text,
  crs text,
  geometry_type text,
  feature_count int,
  checksum text,
  retrieval_date timestamp,
  refresh_policy text,
  is_approved boolean default false, -- instructor approval required
  metadata jsonb default {},
  created_at, updated_at

data_source_versions:
  id uuid pk, source_id uuid → data_sources,
  version_number int not null,
  schema_snapshot jsonb not null, -- field names, types, sample values
  geometry_snapshot jsonb, -- sample features
  feature_count int,
  checksum text,
  imported_at timestamp,
  imported_by uuid → users,
  created_at

import_jobs:
  id uuid pk, org_id uuid, source_id uuid → data_sources,
  project_id uuid → projects,
  target_layer_id uuid → project_layers,
  status text not null default 'pending', -- 'pending' | 'running' | 'completed' | 'failed'
  field_mapping jsonb, -- { sourceField: targetField }
  deduplication_rule text,
  append_behavior text, -- 'append' | 'replace' | 'update'
  validation_errors jsonb,
  summary jsonb,
  created_at, updated_at
```

### API Scope
- `POST /api/data-sources` — register a discovered source.
- `GET /api/data-sources` — list sources for the org.
- `GET /api/data-sources/:id` — get with version history.
- `POST /api/data-sources/:id/approve` — instructor approves source (sets `is_approved=true`).

### Tests
- API: CRUD source, approval gating, tenant scoping, version snapshot stored.

### Acceptance Criteria
- [ ] Data sources can be registered with publisher, URL, license, CRS.
- [ ] Each registration creates an initial `data_source_versions` snapshot.
- [ ] Unapproved sources are visible to instructors but marked "pending approval" to students.
- [ ] All queries are tenant-scoped.

---

## Chunk 7 — ArcGIS Portal/Hub Discovery API

**Goal:** Backend service to search ArcGIS Online/Hub for county datasets.

### API Scope
- `POST /api/discovery/search` — search ArcGIS portal.
  - Body: `{ state, county, keywords: ['parcel', 'address', 'road'] }`
  - Implementation: calls `https://www.arcgis.com/sharing/rest/search` with constructed query string.
  - Returns ranked results with: title, publisher, url, description, itemType, layerCount, extent, modifiedDate.
- `GET /api/discovery/preview?url=<FeatureServerUrl>` — fetch layer metadata and sample features.
  - Calls `.../FeatureServer/layers?f=json` for field schema.
  - Calls `.../FeatureServer/0/query?where=1=1&resultRecordCount=5&f=json` for sample features.
  - Returns: layers[], fields[], sampleFeatures[], geometryType, recordCount, crs.

### UI Scope (minimal — just API for now)
- No dedicated UI chunk yet; this powers the Data Catalog panel in Chunk 9.

### Tests
- API integration: mock ArcGIS search response, verify ranking logic.
- Playwright (optional): verify preview endpoint returns schema with `>0` fields.

### Acceptance Criteria
- [ ] Searching for "Travis County Texas parcel" returns ≥1 ArcGIS item.
- [ ] Preview endpoint returns field schema and 5 sample features for a valid FeatureServer URL.
- [ ] Invalid URLs return 400 with clear error.
- [ ] Results are ranked by publisher identity and recency.

---

## Chunk 8 — Data Catalog Panel (Left Sidebar Tab)

**Goal:** UI for browsing registered sources and discovered ArcGIS datasets.

### UI Scope
- Left panel "Data Catalog" tab:
  - Section 1: "Registered Sources" — cards showing approved data sources with publisher, type, date.
  - Section 2: "Discover New Sources" — search form (state, county, keywords). Results list with rank score.
  - Section 3: "Import History" — list of past `import_jobs` with status badges.
- Each source card: title, publisher badge, type icon, date, feature count, "Preview" button, "Import" button (if approved).
- Preview opens a modal: map thumbnail + field table + sample features table.

### API Scope
- Consumes `GET /api/data-sources`, `POST /api/discovery/search`, `GET /api/discovery/preview`.

### Tests
- Playwright: search for "Harris County roads" → results appear → click Preview → modal shows field schema.

### Acceptance Criteria
- [ ] Data Catalog tab lists all registered sources for the org.
- [ ] Search form queries ArcGIS and returns ranked results.
- [ ] Preview modal shows publisher, field schema, sample features, CRS.
- [ ] Import button is disabled for unapproved sources (student view).
- [ ] Approved sources show an "Import" button that starts an import job.

---

## Chunk 9 — Source Provenance Display

**Goal:** Every imported or discovered source shows its provenance metadata.

### UI Scope
- Provenance section in the preview modal (Chunk 8) and in the Data Catalog card:
  - Publisher name + link
  - Source URL (clickable, truncated)
  - License/terms badge
  - CRS (e.g., "EPSG:2277 — NAD83 / Texas South Central")
  - Update/retrieval date
  - Feature count in project area
  - Spatial overlap percentage (calculated via Turf.js intersection of source extent with study area bbox)
  - Data quality warnings (e.g., "CRS mismatch — source is projected, project uses WGS84")
  - Attribution text
- Provenance is read-only after import.

### API Scope
- `GET /api/data-sources/:id/provenance` — returns full provenance metadata.
- Spatial overlap calculation: use `@turf/turf` `bboxPolygon` + `intersect` + `area`.

### Tests
- Unit: spatial overlap 100% when source extent fully contains study area.
- Playwright: preview modal shows all provenance fields.

### Acceptance Criteria
- [ ] Every source card shows publisher, license, CRS, date.
- [ ] Preview modal shows spatial overlap percentage.
- [ ] CRS mismatch triggers a visible warning badge.
- [ ] Feature count is scoped to the study area (not total dataset).

---

## Chunk 10 — Shapefile/GeoJSON Upload Backend

**Goal:** Handle file uploads safely with validation.

### API Scope
- `POST /api/imports/upload` — multipart upload.
  - Accepts: `.zip` (shapefile), `.geojson`, `.json`, `.kml`, `.kmz`.
  - Max size: 50MB.
  - Virus scan: not in scope for training platform; trust instructor-uploaded files.
  - Validation:
    - For `.zip`: check for `.shp`, `.shx`, `.dbf`, `.prj` (`.prj` required, warn if missing).
    - Detect geometry type, feature count, field names/types, CRS from `.prj` or GeoJSON `crs`.
    - Check for invalid/null geometry, self-intersections (use Turf.js `kinks`).
    - Reject if >10,000 features (training-scale limit).
  - Stores uploaded file to R2/S3 with key `uploads/{orgId}/{jobId}/{filename}`.
  - Returns: `jobId`, detected schema, validation warnings.

### Tests
- API integration: upload a valid GeoJSON, verify schema detection. Upload a bad zip, verify error.
- Unit: CRS detection from `.prj` WKT string.

### Acceptance Criteria
- [ ] Valid GeoJSON upload returns detected geometry type, feature count, CRS, field schema.
- [ ] Shapefile ZIP without `.prj` returns a warning but is accepted.
- [ ] Upload with >10,000 features is rejected with 413.
- [ ] Invalid geometry triggers validation warnings in response.
- [ ] File is stored in R2 with org-scoped path.

---

## Chunk 11 — Import Wizard UI

**Goal:** Step-by-step import wizard for uploaded files.

### UI Scope
- Modal wizard with 5 steps:
  1. **Upload** — drag-and-drop zone, file type validation, progress bar.
  2. **Preview** — map preview of geometry, attribute table preview (first 10 rows), detected CRS.
  3. **Target Layer** — dropdown of existing `project_layers` or "Create new reference layer".
  4. **Field Mapping** — two-column UI: source fields on left, target layer fields on right. Auto-match by name similarity. User can override.
  5. **Review & Commit** — summary: source file, target layer, field mappings, feature count, append behavior (append/replace). "Import" button creates an `import_jobs` row and starts background processing.

### API Scope
- `POST /api/imports` — create import job from wizard data.
- `GET /api/imports/:id` — poll for status.

### Tests
- Playwright: full wizard flow — upload GeoJSON → preview → select target layer → map fields → commit → status goes to "completed".

### Acceptance Criteria
- [ ] Drag-and-drop accepts GeoJSON, Shapefile ZIP, KML.
- [ ] Preview step shows geometry on map and first 10 attribute rows.
- [ ] Target layer dropdown lists all project layers.
- [ ] Field mapping auto-suggests matches (e.g., `FULLNAME` → `road_name`).
- [ ] Review step shows a clear summary before commit.
- [ ] Commit creates an import job and redirects to import history.

---

## Chunk 12 — Field Mapping Templates

**Goal:** Save field mappings per county/source so repeated projects don't require remapping.

### Schema Scope
Extend `field_mapping_templates` table:
```sql
field_mapping_templates:
  id uuid pk, org_id uuid,
  name text not null,
  source_type text not null, -- 'shapefile_road' | 'arcgis_parcel' | 'geojson_address'
  county_fips text, -- nullable, for county-specific templates
  mappings jsonb not null, -- [{ sourceField, targetField, transform }]
  created_by uuid → users,
  is_shared boolean default false, -- org-wide vs personal
  created_at, updated_at
```

### API Scope
- `POST /api/field-mapping-templates` — save current mapping as template.
- `GET /api/field-mapping-templates` — list templates scoped by org + user.
- `GET /api/field-mapping-templates/:id` — get template details.
- `POST /api/imports/apply-template` — apply a template to an import job, auto-filling field mappings.

### UI Scope
- Step 4 of import wizard: "Save as template" checkbox + name input.
- Template selector dropdown above the mapping grid: "Use saved template: Travis County Roads v2".

### Tests
- API: save template, apply template, verify mappings populated.

### Acceptance Criteria
- [ ] User can save a field mapping as a named template.
- [ ] Templates are scoped to org (shared) or user (private).
- [ ] Applying a template pre-fills the field mapping grid.
- [ ] Templates can be filtered by source type and county.

---

## Chunk 13 — Import Background Job & Validation

**Goal:** Process imports asynchronously with validation.

### API Scope
- Background processing (synchronous for training-scale data, async hook for future):
  - Read uploaded file from R2.
  - Transform CRS to WGS84 if needed (using `proj4` or Turf.js).
  - Validate each feature:
    - Geometry validity (Turf.js `booleanValid`)
    - Self-intersections (Turf.js `kinks`)
    - Duplicates (spatial + attribute hash)
    - Required target fields populated
  - Insert valid features into `network_elements` with `parent_container_id=null`, `is_preloaded=true`, `source_id` linked.
  - Update `import_jobs` status: `running` → `completed` or `failed`.
  - Store validation errors in `import_jobs.validation_errors`.

### Tests
- API integration: upload invalid GeoJSON (self-intersecting polygon) → import job fails with validation error.
- Unit: CRS transformation from EPSG:2277 to WGS84.

### Acceptance Criteria
- [ ] Import job processes features and inserts them as `network_elements`.
- [ ] Invalid geometries are rejected with detailed error messages.
- [ ] Duplicate features are detected and flagged.
- [ ] CRS transformation preserves geometry accuracy within 1 meter.
- [ ] Import summary shows: imported count, rejected count, error list.

---

## Chunk 14 — Layer Styling and Symbology

**Goal:** Apply GIS-style symbology to layers.

### Schema Scope
Extend `project_layers.style` JSONB schema:
```json
{
  "color": "#2563eb",
  "width": 3,
  "opacity": 0.8,
  "dashArray": [4, 2],
  "fillColor": "#3b82f6",
  "fillOpacity": 0.2,
  "symbol": "circle" | "square" | "triangle",
  "size": 8,
  "labelField": "road_name",
  "labelColor": "#111",
  "labelSize": 12,
  "scaleMin": 10,
  "scaleMax": 19
}
```

### UI Scope
- Left panel layer tree: right-click layer → "Style" opens a popover.
- Style editor: color picker, width slider, opacity slider, dash pattern picker, label field dropdown.
- Changes apply immediately to the map (live preview).
- Style is persisted in `project_layers.style`.

### API Scope
- `PATCH /api/projects/:id/layers/:layerId/style` — update style JSONB.

### Tests
- Playwright: change layer color → map layer color updates immediately.

### Acceptance Criteria
- [ ] Layer style editor shows color, width, opacity, dash pattern controls.
- [ ] Style changes are live on the map.
- [ ] Labels can be enabled/disabled per layer with field selection.
- [ ] Style persists across reload.

---

## Chunk 15 — Road Centerline and Address Intelligence

**Goal:** First base-data intelligence feature: canonical road names and address points.

### Schema Scope
Extend with `road_segments` and `address_points` tables:
```sql
road_segments:
  id uuid pk, org_id uuid, project_id uuid, layer_id uuid → project_layers,
  segment_id text not null, -- stable external ID
  road_name text not null,
  prefix text, name text, suffix text, directional_suffix text,
  aliases text[],
  road_class text, surface text, jurisdiction text,
  left_from int, left_to int, right_from int, right_to int,
  geometry text not null,
  source_id uuid → data_sources,
  created_at, updated_at

address_points:
  id uuid pk, org_id uuid, project_id uuid, layer_id uuid,
  address_id text not null,
  house_number text, street_prefix text, street_name text, street_type text, unit text,
  city text, state text, postal_code text,
  parcel_external_id text,
  geometry text not null,
  source_id uuid → data_sources,
  created_at, updated_at
```

### UI Scope
- Global search bar (top bar): search by road name or address → results dropdown → click to zoom and select.
- Right panel "Attributes" tab for road segments: show full name, aliases, address ranges, class.
- Map: road labels follow line geometry (MapLibre `symbol` layer with `line-center` placement).

### API Scope
- `GET /api/search?q=query&projectId=id` — search road_segments + address_points by text match.
- `POST /api/road-segments` — bulk insert from import job.
- `POST /api/address-points` — bulk insert from import job.

### Tests
- Playwright: type "Oakwood" in global search → road segment result → click → map zooms to road.
- Unit: road name normalization (trim, standardize suffixes).

### Acceptance Criteria
- [ ] Global search finds roads and addresses by partial text match.
- [ ] Road labels follow the line geometry on the map.
- [ ] Address points are searchable by house number + street name.
- [ ] Road segments store left/right address ranges.
- [ ] Source attribution is visible for every road and address.

---

## Cross-Cutting Concerns

### Security (carried from previous audit)
- All new API routes must use `getAuthFromRequest` + `org_id` scoping.
- Students cannot create layers, approve sources, or delete imported data.
- Instructors can manage all data within their org.
- `requireJwtSecret()` already fails closed in production.

### Tenant Scoping
- Every new table must have `org_id` (non-null where possible, with migration to backfill existing).
- Every query must filter by `org_id`.
- No `SELECT *` without `org_id` predicate.

### Testing Strategy
- Each chunk must include:
  - 1+ API integration test (Vitest + `next-test` or direct fetch against dev server).
  - 1+ Playwright E2E test for UI chunks.
  - 1+ unit test for pure logic (schema validation, ranking, field mapping).
- Add `npm test` script to `package.json` using Vitest.
- CI workflow (GitHub Actions) runs `npm run lint && npm run typecheck && npm run test && npm run build`.

### Data Migration
- Existing `network_elements` table already has `org_id` (nullable). Migration needed: backfill `org_id` for existing rows from `project_id` → `projects.org_id`.
- New tables start with `org_id` non-null.

### MapLibre Integration
- All new layers must use MapLibre `addSource`/`addLayer` pattern.
- Sources must be keyed by layer ID: `source-layer-{layerId}`.
- Styles must be applied via `paint` properties, not inline.
- Layer visibility controlled via `layout.visibility`.

### CRS Handling
- Use `proj4` package for CRS transformations.
- Store original CRS in `data_sources.crs`.
- Always normalize display geometry to WGS84 (EPSG:4326).
- Use local projected CRS (e.g., State Plane) for engineering measurements only.

---

## Dependencies to Add

- `proj4` — CRS transformations
- `@tanstack/react-table` — attribute table (optional, can use native `<table>` for training scale)
- `adm-zip` or `jszip` — client-side ZIP extraction for shapefile preview
- `shapefile` or `@mapbox/shp-write` — shapefile parsing
- `papaparse` — CSV with coordinates
- `geojson-validation` — GeoJSON schema validation

---

## Commit Sequence

1. `feat(chunk-1): GIS workspace app shell layout`
2. `feat(chunk-2): layer tree panel with DB-backed layer system`
3. `feat(chunk-3): feature inspector panel with context-aware tabs`
4. `feat(chunk-4): attribute table panel with layer selection`
5. `feat(chunk-5): study area model and Census county picker`
6. `feat(chunk-6): data source registry schema and API`
7. `feat(chunk-7): ArcGIS Portal/Hub discovery API`
8. `feat(chunk-8): data catalog panel UI`
9. `feat(chunk-9): source provenance display with spatial overlap`
10. `feat(chunk-10): shapefile/GeoJSON upload backend with validation`
11. `feat(chunk-11): import wizard UI with 5-step flow`
12. `feat(chunk-12): field mapping templates`
13. `feat(chunk-13): import background job and validation engine`
14. `feat(chunk-14): layer styling and symbology editor`
15. `feat(chunk-15): road centerline and address intelligence with global search`

Each commit must pass: `npm run lint && npx tsc --noEmit && npm run build && npm run test`.

---

## Open Questions (Out of Scope for This Plan)

1. AutoCAD HLD 1 and HLD 5 handoff format — deferred to Phase 9.
2. Service group entity and MST sizing workflow — deferred to Phase 5.
3. Closure service sets and FDH topology — deferred to Phase 7.
4. Student assignment/prerequisite system — deferred to Phase 8.
5. Real-time collaborative editing — not in scope.
6. Production DWG-to-GeoJSON pipeline (FastAPI sidecar) — existing prototype preserved, not expanded.
