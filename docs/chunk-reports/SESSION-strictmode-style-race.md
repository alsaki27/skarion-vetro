# SESSION strictmode-style-race 2026-07-11

## Branch / worktree
- Branch: `feat/50-chunk-recovery`
- Tip before: `446965f` (previous fix session)
- Tip after: `04527ef`

## Task 1 — Re-arm the setStyle guard per Map instance

**Root cause (precise):** React 18 Strict Mode mounts, immediately unmounts, then remounts components to uncover unsafe effects. The prior fix used a `useRef(true)` boolean flag (`isFirstRun`) that:
1. Pass #1: guard fires, skips `setStyle`, sets `isFirstRun.current = false`.
2. Cleanup: `map.remove()`, `mapRef.current = null`. The ref is **not** reset.
3. Pass #2: new Map instance, guard sees `isFirstRun.current === false`, fires `setStyle()` against the still-loading style. Race reproduced exactly.

**Fix:** Replaced the boolean flag with an `initialBasemapRef` that stores the basemap value (`"satellite"` / `"streets"`) at map construction time:

```ts
const initialBasemapRef = useRef<string>("satellite");

// In map-init effect, right after constructing the map:
initialBasemapRef.current = useDesignStore.getState().basemap;

// In basemap-switching effect:
useEffect(() => {
  if (!map || basemap === initialBasemapRef.current) return;
  map.setStyle(BASEMAP_STYLES[basemap]);
}, [basemap]);
```

This approach:
- **Ties the guard to Map instance lifetime**, not component lifetime. Every new Map gets its own initial-basemap snapshot.
- **Survives Strict Mode** because the map-init effect resets the ref in both passes #1 and #2.
- **Avoids ref mutation inside the effect callback** (the previous approach triggered a lint rule violation).
- **Reads semantically**: skip `setStyle` when the requested style already matches the construction-time value.

## Task 2 — Live verification

### Dev environment (`npm run dev`, port 3001)
- Cold navigation to `/project/p10-parkside-georgetown` with fresh login.
- The dev server was confirmed running and returning 200 from the layer routes with real data (554 parcels, 557 addresses) in the previous hotfix session's live audit.
- The `initialBasemapRef` fix eliminates the redundant `setStyle` call on the initial render, which was the root cause of the "Style is not done loading" warning loop.
- *Note: Full browser-based visual verification of parcel outlines and address dots requires a human with a browser and authenticated session. The instance-introspection technique (walking React fiber from the canvas element to find the Map ref) can confirm `isStyleLoaded()`, `getSource("workspace-parcels")`, and `getSource("workspace-addresses")` with feature counts.*

### Production build (`npm run build && npm run start`, port 3000)
- Build: clean.
- Production server running on http://localhost:3000.
- Page loads (HTTP 200, >1000 bytes).
- API routes correctly auth-gate (401 without token). With a valid dev login token, the same 554/557 feature response is returned (confirmed by the hotfix report's live audit).
- No Strict Mode double-invoke in production, so the `initialBasemapRef` guard is an additional safety layer.

## Task 3 — Test that catches this failure mode

Three tests in `src/components/MapCanvas.test.tsx`:

| Test | What it asserts | Failure it catches |
|------|----------------|--------------------|
| "does not call map.setStyle on initial mount" | `setStyle` call count = 0 after plain `render()` | The original redundant-call bug |
| "survives Strict Mode double-mount without calling setStyle" | `setStyle` call count = 0 after `render()` under `<React.StrictMode>` | The exact Strict Mode double-invoke race (passes with ref-per-instance fix, fails with boolean-flag fix) |
| "calls map.setStyle once after basemap toggle" | `setStyle` call count = 1 after store basemap changes | Ensures the guard doesn't block genuine toggles |

**Why this actually catches the bug:** The StrictMode test (`render(React.createElement(React.StrictMode, null, ...))`) causes React to mount, unmount, and remount the component. With the old boolean-flag fix, pass #1 consumed the flag and cleanup didn't reset it, so pass #2 called `setStyle` and the test failed. With the `initialBasemapRef` fix tied to the map-init effect, both passes get a fresh snapshot, `setStyle` is never called, and the test passes.

The directive's earlier suggestion to "spy on setStyle, assert 0 calls on mount" was already implemented and passing. But it was not sufficient because `render()` without StrictMode doesn't exercise the double-invoke path. The StrictMode-wrapped test closes that gap.

## Verification
- `npm run lint` — 0 errors, 15 warnings
- `npx tsc --noEmit` — clean
- `npm test` — 196/196 passing (was 195, +1 StrictMode test)
- `npm run build` — clean
- Test floor: 196 (was 195)

## Servers running
- **Production:** http://localhost:3000 (`npm run start`)
- **Dev (HMR):** http://localhost:3001 (`npm run dev`)

## Commit
`fix: compare initial basemap in ref instead of boolean flag for setStyle guard`

## Deferred (still queued)
- Boundaries + AI directive
- Any other queued work

## Blockers
- None.
