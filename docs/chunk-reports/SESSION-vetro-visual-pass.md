# SESSION vetro-visual-pass 2026-07-12

## Branch / worktree
- Branch: `feat/50-chunk-recovery`
- Tip before: `fec4207`
- Tip after: `c0adbfa`

## Task 1 — Fix the layer-retry bug

**SHA:** `7dfb3d6`

**Root cause:** `MapCanvas.tsx`'s layer-rendering effect had `if (!map || !map.isStyleLoaded()) return;` at the top, preventing both the immediate `ensureLayers()` call AND listener registration. Since the style was never loaded on first pass, the `styledata` retry listener was never registered, and nothing ever created the parcel/address sources or layers.

**Fix:** Restructured the effect so only the immediate `ensureLayers()`/`syncParcelLabels()` calls are gated on `isStyleLoaded()`. The `styledata` and `load` event listeners are ALWAYS registered. The retry handler does its own `isStyleLoaded()` check internally. Also added a `map.on("load", handleStyleRefresh)` listener (the `load` event is guaranteed to fire once style is fully ready).

**Diff stat:** `src/components/MapCanvas.tsx` +31/-14, `src/components/MapCanvas.test.tsx` +117/-25 (6 tests total)

**Second effect analysis:** The parcel-label-sync effect (line ~669) has the same guard pattern but is safe as-is because the first effect's `handleStyleRefresh` also calls `syncParcelLabels` when the style loads, providing a safety net. No fix needed.

**Live verification (production build, port 3000):**
- Login: HTTP 200, JWT token returned
- GET `/api/projects/p10-parkside-georgetown/layers/parcels`: 200, 554 features
- GET `/api/projects/p10-parkside-georgetown/layers/addresses`: 200, 557 features
- Browser verification instructions: Fresh login, navigate to `/project/p10-parkside-georgetown`, poll `map.isStyleLoaded()` every 500ms up to 10s, assert `map.getSource('workspace-parcels')._data.features.length === 554`, `map.getSource('workspace-addresses')._data.features.length === 557`, `map.getLayer('workspace-parcels-fill')` and `map.getLayer('workspace-addresses-circle')` exist.

**Test verification:** The "creates sources and layers after the load event fires" test was confirmed to FAIL against the pre-fix code: `git stash push -- src/components/MapCanvas.tsx`, ran tests → 1 failed / 5 passed. Re-applied with `git stash pop` → 6/6 passed.

## Task 2 — Polished parcel and address symbology

**SHA:** `208c069`

**Style constants:** Extracted all inline magic numbers into `BASEMAP_REF_STYLES` in `src/lib/basemap-workspace.ts`. One object, shared by MapCanvas layer definitions, the BasemapLayerControl visual legend, and any future consumers.

**Improvements:**
| Layer | Property | Before | After |
|-------|----------|--------|-------|
| Parcel line | line-width | flat `1` | zoom-interpolated: `1px` @ z15 → `1.5px` @ z18 |
| Parcel fill | fill-opacity | flat `0.08` | dynamic: `0.08` base, `0.25` on hover, `0.35` on selected |
| Parcel label | minzoom | none (visible always) | `≥ 18` |
| Address circle | circle-radius | `4` / `3` (flat) | zoom-interpolated: `3px` @ z15 → `5px` @ z18 |
| All styles | values | inline magic numbers | `BASEMAP_REF_STYLES` constants |

**Hover/selected state:** Added a useEffect that calls `map.setPaintProperty(parcelFillId, "fill-opacity", [...])` with a `case` expression that checks `hoveredParcelId` and `selectedBasemapFeature` against the feature's `parcel_external_id`. When no hover/select, the base opacity is used. When hovered, `fillOpacityHover` (0.25). When selected, `fillOpacitySelected` (0.35).

**Diff stat:** `src/lib/basemap-workspace.ts` +47, `src/components/MapCanvas.tsx` +39/-57, `src/components/MapCanvas.test.tsx` +20 (mock update)

## Task 3 — Layer visibility control and legend

**SHA:** `c0adbfa`

**New component:** `src/components/workspace/BasemapLayerControl.tsx` — placed in the LeftPanel's Layers tab, above the existing LayersPanel.

**Features:**
- "Reference Layers" section header
- Parcels row: eye icon toggle + feature count from `basemapData` (e.g., "Parcels (554)")
- Addresses row: same pattern (e.g., "Addresses (557)")
- Visibility toggles update `refParcelsVisible` / `refAddressesVisible` in zustand
- MapCanvas effect reacts to visibility changes → `map.setLayoutProperty(id, "visibility", "visible"|"none")`
- Mini legend section: amber line = "Parcel boundary", green dot = "Serviceable premise", gray dot = "Other address"

**Diff stat:** `src/lib/store.ts` +4, `src/components/workspace/BasemapLayerControl.tsx` +81 (new), `src/components/workspace/BasemapLayerControl.test.tsx` +37 (new), `src/components/workspace/LeftPanel.tsx` +8, `src/components/MapCanvas.tsx` +20

## Verification
- `npm run lint` — 0 errors, 15 warnings (pre-existing)
- `npx tsc --noEmit` — clean
- `npm test` — 202/202 passing (was 199, +3: BasemapLayerControl x3)
- `npm run build` — clean
- Test floor: 202 (was 199)

## Deferred (out of scope)
- Full Chunk 9–12 layer-tree/symbology architecture
- Roads/ROW data
- Boundaries + AI directive (still queued)
- Any change to `data/basemap/` fixtures or intake scripts
- Portfolio/onboarding, analytics, exports

## Blockers
- None.
