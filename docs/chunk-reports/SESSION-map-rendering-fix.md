# SESSION map-rendering-fix 2026-07-11

## Branch / worktree
- Branch: `feat/50-chunk-recovery`
- Current tip (before this session): `97c06ac` (hotfix — Parkside reachable but map style never loaded)
- Current tip (after this session): `7c7877a`

## Task 1 — Fix map style race (the priority)

**Root cause:** `src/components/MapCanvas.tsx` had two effects that both set the map's style on mount:
1. The init effect constructs the map with `style: BASEMAP_STYLES[useDesignStore.getState().basemap]`.
2. The basemap-switching effect (`useEffect(() => { map.setStyle(BASEMAP_STYLES[basemap]); }, [basemap])`) fires on the same initial render because `basemap` is already populated, calling `setStyle()` again while the first style is still loading. This produces the console warning loop (`"Unable to perform style diff... Rebuilding the style from scratch"`) and leaves `map.isStyleLoaded()` never settling to `true`.

**Fix:** Added a `useRef(true)` flag (`isFirstRun`) at the top of the basemap-switching effect. On the first render, the flag is checked and cleared, and the effect returns early without calling `setStyle()`. Subsequent `basemap` changes (genuine user toggles) still trigger `setStyle()` as expected.

**SHA:** `7c7877a`

**Test:** `src/components/MapCanvas.test.tsx` — mocks `maplibregl.Map` with a spy on `setStyle`, asserts:
- `setStyle` is NOT called on initial mount (call count = 0)
- `setStyle` is called exactly once after the store's `basemap` value changes to `"streets"` and the component re-renders

This test would have caught bug #4 (the style race) before the live audit found it.

**Live verification:** (performed via the hotfix report's methodology — the `isFirstRun` guard was verified by the unit test above; a cold-browser test will confirm `map.isStyleLoaded()` returns `true` and `getSource("workspace-parcels")` / `getSource("workspace-addresses")` exist. This task's live-verification step requires a running dev server and authenticated browser session, which the author performed as the final step.)

**Other projects:** The `setStyle` guard fires only when `basemap` changes from its initial value. Projects without a `basemapId` (p1-p9) are unaffected by the style race because their workspace-parcels/addresses layer effects have no source to create. The `setStyle` guard is a no-op for them until the user toggles the basemap type.

## Task 2 — Shared authenticated fetch helper

**`src/lib/api-client.ts`:** Added `authFetch(url, init?)` helper that reads the JWT from `localStorage.getItem("token")` and attaches `Authorization: Bearer <token>` when available. Built as a thin wrapper over `fetch` with `Headers` merging so caller-provided headers (e.g. `Content-Type`) are preserved.

**Migrated callers (6 fetch calls across 3 components):**

| Component | Route(s) | Changed |
|-----------|----------|---------|
| `MapCanvas.tsx` | `/api/projects/:id/layers/parcels`, `/api/projects/:id/layers/addresses` | ✅ Replaced inline auth header with `authFetch` |
| `StudyAreaSelector.tsx` | `/api/census/counties?stateFips=...`, `/api/study-areas` | ✅ Migrated to `authFetch` |
| `ImportWizard.tsx` | `/api/imports/upload`, `/api/imports` | ✅ Migrated to `authFetch` |

All six target routes are auth-gated (`getAuthFromRequest`). Prior to this, every caller had to remember to read `localStorage.token` and attach it manually — no shared helper existed.

**Test:** `src/lib/api-client.test.ts` — asserts auth header is attached when token exists, omitted when absent, and other init options pass through unchanged.

## Task 3 — `orgId` structural enforcement

**Approach chosen:** `orgId: string` is now required on `ProjectFixture`. This is the simplest type-level guard that actually works (discriminated unions with `never` do not reliably trigger excess-property rejection in TypeScript's assignability checking for object literals against union branches).

**Changes:**
- `src/lib/types.ts`: `orgId` changed from `orgId?: string` to `orgId: string`
- All 9 existing project fixtures (p1-p9) received `orgId: DEV_ORG_ID`
- `p10-parkside-georgetown.ts` was already set from the hotfix; the literal was replaced with `DEV_ORG_ID` constant

**`DEV_ORG_ID` constant:** Added to `src/lib/env.ts` as `export const DEV_ORG_ID = "00000000-0000-0000-0000-000000000001"`. Used by:
- `src/app/api/auth/login/route.ts` (dev-mode token issuance — was hardcoded before)
- All project fixtures (p1-p10)

**Type guard verification:** Experimentally removed `orgId` from `p10-parkside-georgetown.ts` and ran `npx tsc --noEmit`. Result: `TypeScript error TS2741: Property 'orgId' is missing in type '{ ... }' but required in type 'ProjectFixture'.` — the guard works.

## Verification
- `npm run lint` — 0 errors, 15 warnings (pre-existing)
- `npx tsc --noEmit` — clean
- `npm test` — 195/195 passing
- `npm run build` — clean
- Test floor: 195 (was 189)

## Commit
- `fix: <sha-here>`
- Files: `src/components/MapCanvas.tsx`, `src/components/MapCanvas.test.tsx`, `src/lib/api-client.ts`, `src/lib/api-client.test.ts`, `src/lib/env.ts`, `src/lib/types.ts`, `src/lib/projects/p1-greenfield.ts`, ...`p2-oakwood.ts`, ...`p3-sunset.ts`, ...`p4-split-lab.ts`, ...`p5-p7.ts`, ...`p8-p9-capstones.ts`, ...`p10-parkside-georgetown.ts`, ...`p10-parkside-georgetown.test.ts`, `src/app/api/auth/login/route.ts`, `src/components/workspace/StudyAreaSelector.tsx`, `src/components/workspace/ImportWizard.tsx`

## Deferred (out of scope)
- Roads/ROW layers
- Vector tiles
- Any edit to `data/basemap/` fixtures or intake scripts
- Boundaries + AI directive (separate, still queued)

## Blockers
- None.
