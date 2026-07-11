# Plan: Fix Codex Gaps in feat/50-chunk-recovery

## Context

Branch `feat/50-chunk-recovery`, tip `ee14313`. Codex completed Tasks 3b/3c/4/5 in a single commit but left significant gaps. The goal is one clean follow-up commit that closes all remaining gaps, raises the test floor, and updates the session report.

Standing rules enforced: lint → typecheck → test → build before every commit; one task = one commit + chunk report entry.

---

## Task 1 — Fix Parkside Georgetown Project Fixture (3c gaps)

### 1a. Extract and hardcode real premises from basemap

The fixture `src/lib/projects/p10-parkside-georgetown.ts` currently only preloads a CO and a vault. The directive requires:
- 51 serviceable premises (OPEN + SINGLE FAMILY) from the AUTUMN OAK WAY / SHADY SPRING TRL / BLUE CREEK LN pocket
- 40 CLOSED/other addresses as non-serviceable context
- Each premise carries `address_external_id` and `parcel_external_id` in attributes

**Why hardcode?** The fixture is imported by client components (`curriculum/page.tsx`, `workspace/[projectId]/page.tsx`, `MapCanvas.tsx`). `fs` is not available client-side, so we cannot call `loadAddresses()` at module import time.

**Extraction approach:**
1. Run a one-time Node.js script (or inline command) that loads `data/basemap/wilco-l131725c/addresses.geojson`
2. Filter: `street_full` ∈ `{AUTUMN OAK WAY, SHADY SPRING TRL, BLUE CREEK LN}` AND `status === "OPEN"` AND `address_type === "SINGLE FAMILY"`
3. Sort by distance from project center `[-97.7653, 30.6048]`, then by `full_address`
4. Slice first 51 → these are the serviceable premises
5. Collect all addresses where `status !== "OPEN"` OR `address_type !== "SINGLE FAMILY"` → 40 non-serviceable context premises
6. Generate `NetworkElement[]` premise entries with `type: "premise"`, `locked: true`, `position` from GeoJSON coordinates, and attributes `address_external_id`, `parcel_external_id`, `status`, `address_type`, `serviceable`
7. Paste the generated array into the fixture file as `preloadedElements`
8. Add the `serviceableParcelIds` field to `ProjectFixture` (see 1c below)

### 1b. Fix project metadata

- Change `mapCenter` from `[-97.7704, 30.6002]` to `[-97.7653, 30.6048]` (directive value)
- Change `environment` from `"mixed"` to `"underground"` (directive value)
- Add `maxDropCableFt: 300` constraint (directive says "300 ft max drop")
- Add preloaded MST elements near the pocket (4-port, 6-port, 8-port) so students have infrastructure to work with

### 1c. Add `serviceableParcelIds` to `ProjectFixture`

Add a new optional field to `ProjectFixture` in `src/lib/types.ts`:

```ts
serviceableParcelIds?: string[];
```

In the Parkside fixture, populate it with the unique `parcel_external_id`s from the 51 serviceable premises.

### 1d. Update the Parkside test

`src/lib/projects/p10-parkside-georgetown.test.ts` currently only verifies fixture registration and basemap link. Extend it:

1. Verify `preloadedElements` contains exactly 51 serviceable `premise` elements
2. Verify every serviceable premise has `address_external_id` and `parcel_external_id` attributes
3. Verify non-serviceable premises exist and have `serviceable: false` attribute
4. Verify `serviceableParcelIds` is defined and length > 0
5. Verify no duplicate `address_external_id` values

---

## Task 2 — Add Trespass Grading Check (3c required test)

The directive requires: *"a drop drawn across a non-served parcel fires the trespass check naming that parcel's `parcel_external_id`"*.

### 2a. Extend `DesignContext` and `buildContext`

Add optional `basemapData?: BasemapDataset | null` to `DesignContext` in `src/lib/grading/engine.ts`. Modify `buildContext` to accept a third optional parameter `basemapData` and include it in the returned context.

This allows the trespass check to access parcel geometry. On the client, `MapCanvas` already loads `basemapData` into the store; the grading call site can pass it. On the server, API routes can load it via `loadParcels` / `loadAddresses`.

### 2b. Implement `trespass` CheckDef

Add to `CHECK_REGISTRY`:

```ts
const trespass: CheckDef = {
  id: "trespass",
  category: "compliance",
  run(ctx) {
    // Skip if no basemap data or no parcels
    if (!ctx.basemapData?.parcels?.length) {
      return { checkId: "trespass", category: "compliance", status: "pass", score: 100, message: "No basemap parcel data available for trespass check." };
    }

    const serviceableSet = new Set(ctx.project.serviceableParcelIds ?? []);
    const violations: { lineId: string; parcelId: string }[] = [];

    for (const line of ctx.lines) {
      for (const vertex of line.path) {
        for (const parcel of ctx.basemapData.parcels) {
          const parcelId = String(parcel.properties.parcel_external_id ?? "");
          if (!parcelId || serviceableSet.has(parcelId)) continue;

          // Use turf booleanPointInPolygon for vertex-in-parcel test
          // For line-segment crossing, use turf booleanIntersects between lineString(vertex pair) and parcel polygon
          const inside = booleanPointInPolygon(point(vertex), parcel.geometry as GeoJSON.Polygon);
          if (inside) {
            violations.push({ lineId: line.id, parcelId });
          }
        }
      }
    }

    // Deduplicate violations
    const uniqueViolations = Array.from(new Map(violations.map((v) => [`${v.lineId}-${v.parcelId}`, v])).values());
    const score = uniqueViolations.length === 0 ? 100 : Math.max(0, 100 - uniqueViolations.length * 10);

    return {
      checkId: "trespass",
      category: "compliance",
      status: uniqueViolations.length === 0 ? "pass" : "fail",
      score,
      message: uniqueViolations.length === 0
        ? "All routes stay within served parcels."
        : `Trespass on non-served parcel(s): ${uniqueViolations.map((v) => v.parcelId).join(", ")}.`,
      elementIds: uniqueViolations.map((v) => v.lineId),
    };
  },
};
```

**Note on geometry:** Use `@turf/turf` imports (`point`, `booleanPointInPolygon`). For line-segment crossing (more robust than vertex-only), iterate `line.path` as segment pairs and test `booleanIntersects` against each parcel polygon. For the training-grade check, vertex-only is acceptable; add segment crossing if trivial.

### 2c. Register `trespass` in Parkside grading weights

Add `trespass: 0.15` (or appropriate weight) to `p10ParksideGeorgetown.gradingWeights`, reducing other weights proportionally so total = 1.0.

### 2d. Wire `basemapData` into grading calls

- **Client:** In `MapCanvas.tsx` or the workspace grading trigger, pass `basemapData` from the store as the third arg to `runGrading`
- **Server:** In the grading API route, load `basemapData` via `loadParcels` / `loadAddresses` before calling `runGrading`

If this refactor is too invasive for the scope, the alternative is to **server-only** the trespass check and skip client-side live preview for it. The directive's "(Optional) Add the checkId to a project's requirements array" implies this is acceptable.

### 2e. Write the trespass test

In `src/lib/projects/p10-parkside-georgetown.test.ts`:

1. Load a known non-served parcel from the basemap (one whose `parcel_external_id` is NOT in `serviceableParcelIds`)
2. Create a mock `LineElement` (drop cable) with vertices that cross that parcel
3. Build a design context with the Parkside project and the trespassing line
4. Run the `trespass` check
5. Assert: status = "fail", message contains the non-served parcel's `parcel_external_id`

---

## Task 3 — Close LLD Engine Test Gaps (4)

Extend `src/lib/lld-engines.test.ts` with the missing assertions. Do not rewrite existing tests — add new `it()` blocks.

### 3a. fiber-engine — spare-gap accounting

Add a test that allocates a range, then allocates a "spare" purpose range, and verifies the spare occupies the correct gap fibers and `validateCapacity` still passes.

### 3b. splice-model — duplicate fiber detection + reconciliation

Add a test where two splice entries use the same in-fiber range, and assert `generateSpliceMatrix` detects the duplicate or the trace fails.

Add a test where a splice matrix is reconciled against the original fiber allocations: every matrix row should map to an existing allocation.

### 3c. numbering-engine — determinism + longest-leg + tie-break

Add a test that runs `assignNumbers` twice on the same graph and asserts the result arrays are deeply equal.

Add a test with two paths of different lengths from the FDH, asserting the longer leg gets the higher/lower number as per the engine's rule.

Add a tie-break fixture: two paths of identical length from the FDH, assert deterministic ordering (e.g., lexicographic by node id).

### 3d. label-engine — disagreement detection + capacity bound

Add a test where a label template references a cable attribute that doesn't exist, assert `generateLabel` flags the disagreement or falls back gracefully.

Add a test where `usedCount + spareCount` on a cable exceeds `fiberCount`, assert the label/callout generation detects the overflow.

### 3e. splice-diagram — comprehensive balance

Add a test with: entry range [1,24], spliced [1,12], passed [13,20], spare [21,24]. Assert `validateBalance` passes.

Add a test where entry [1,24] but spliced+passed+spare = [1,22] (missing 23-24), assert `validateBalance` fails.

### 3f. bom-engine — uncataloged-asset rejection

Add a test passing a catalog key that doesn't exist in `HARDWARE_CATALOG` to `buildBOM`, assert the report contains an `uncataloged` line with `status: "error"` or rejects the entry.

---

## Task 4 — STATUS.md Accuracy Pass (5)

Edit `docs/chunk-reports/STATUS.md`:

### 4a. Downgrades

- **Chunk 46** (vector tiles, performance): Change status from `implemented` → `partial`. Evidence: "`src/lib/performance-budgets.ts` has budgets and tile configs, but no vector tile server or load testing exists."
- **Chunk 42** (tiered hints): Change status from `implemented` → `partial`. Evidence: "`src/lib/hints-engine.ts` library exists but no API/UI wiring for hint tracking or mastery evidence."
- **Chunk 43** (analytics): Change status from `implemented` → `partial`. Evidence: "`src/lib/instructor-analytics.ts` library exists but not wired into API; `InstructorDashboard` is still a placeholder."
- **Chunks 35–40**: Verify each has dedicated tests in `lld-engines.test.ts`. If all six have coverage, keep `implemented`. If any are stubs, downgrade that specific chunk.

### 4b. Add "wired into app?" column

Change the table header to include a new column:

```markdown
| Chunk | Title | Status | Wired into app? | Evidence |
```

Populate it:
- `implemented` chunks with API/UI consumers → `yes`
- `implemented` chunks that are library-only (35-40 before tests, 42, 43, 46) → `no`
- `partial` / `absent` → `no` or `partial`

Update the summary counts accordingly.

---

## Task 5 — Closeout Report Finalization (6)

Rewrite `docs/chunk-reports/SESSION-night-2026-07-11.md` to be complete and accurate.

### 5a. Correct the tip

Update the "Current tip" line to `ee14313`.

### 5b. Add per-task SHAs

For each task (1–6), list the commit SHAs that implemented it:
- Task 1: verified, no rebase needed
- Task 2: `240eb7b`
- Task 3a: `675a9e8`
- Task 3b/3c/4/5: `ee14313`
- Task 3c fix + 4 fix + 5 fix + 6: `<new-commit-sha>` (the commit we're about to make)

### 5c. Add diff stats

For the new commit, include `git diff --stat` summary.

### 5d. Test count vs floor

State clearly:
- Before this session: floor `137`, tests `137`
- After Task 2: floor `146` (or whatever), tests `146`
- After Task 3a: floor `154`, tests `154`
- After Codex commit: floor `172`, tests `172`
- After this fix commit: floor `<new-count>`, tests `<new-count>`

### 5e. Deferred items

List anything explicitly out of scope per the directive:
- Roads/ROW layers
- Vector tiles
- Import-wizard UI polish
- Portfolio/onboarding (chunk 45)
- Ops/DR (chunk 49)
- Acceptance mega-journey (chunk 50)

### 5f. Blockers

State "None" or list any actual blockers.

---

## Task 6 — Validation & Commit

1. Run `npm run lint` — must be 0 errors
2. Run `npm run typecheck` — must pass
3. Run `npm test -- --run` — must pass
4. Update `tests/.test-floor` to the new passing count
5. Commit with message: `fix: complete Parkside seeding, trespass check, LLD coverage, status accuracy, closeout`
6. Push: `git push origin feat/50-chunk-recovery`

---

## Open Questions / Risks

1. **Client-side trespass check:** If modifying `buildContext` to accept `basemapData` is too invasive for the workspace grading flow, mark the trespass check as server-only and skip client-side wiring. The directive explicitly says adding checkIds to requirements is optional.
2. **Premise extraction script:** The script that extracts 51+40 premises from GeoJSON should be documented in a code comment in the fixture file, but does not need to be a committed script file. A one-time `node -e "..."` command is sufficient.
3. **Turf import in grading engine:** `engine.ts` currently imports only `distanceFt` and `pathLengthFt` from `geometry.ts`. Adding turf directly to `engine.ts` is acceptable since `@turf/turf` is already a dependency.
