# Hotfix — live browser verification found the flagship project was unreachable

**Context:** the night session and its follow-up both reported "done" based on unit
tests and typecheck/build passing. Nobody had actually opened the app in a browser
and clicked through to Project 10 (Parkside Georgetown) since it was built. When
the owner did, they got the OLD placeholder project (Oakwood) with no real data
visible anywhere — the real work was completely unreachable. This report documents
what a live audit found and what was fixed vs. what remains.

## Bugs found by driving the actual app (not by reading code or running tests)

### 1. FIXED — Parkside hidden behind "coming soon"
`src/app/curriculum/page.tsx` had a hardcoded `ACTIVE_PROJECT_IDS` allowlist
written before Project 10 existed. p10-parkside-georgetown was listed in
`DEFERRED_PROJECTS` and had no clickable entry point at all. The two OLD
synthetic-fixture projects (Oakwood, Sunset Ridge) were the only reachable ones.

**Fix:** added `p10-parkside-georgetown` to `ACTIVE_PROJECT_IDS`, updated the
comment to state it's the flagship real-basemap project.

### 2. FIXED — auth token never attached to the new layer fetches
Login (`POST /api/auth/login`) returns the JWT in the response body and the
client stores it in `localStorage.token` — there is no session cookie. Every
other authenticated flow in the app was untouched by this because nothing else
calls these two routes. `MapCanvas.tsx`'s parcel/address fetches
(`fetch(\`/api/projects/${id}/layers/parcels\`)`) never attached an
`Authorization` header, so they always got 401 regardless of login state.

**Fix:** read the token from `localStorage` and attach
`Authorization: Bearer <token>` on both fetches.

**Not fixed / flagged:** there is no shared `authFetch`/API-client helper
anywhere in the codebase — every component that needs an authenticated fetch
has to remember to do this by hand. That's a latent bug factory. Recommend a
`src/lib/api-client.ts` wrapper in the next session so this class of bug can't
recur silently.

### 3. FIXED — `orgId` unset on every project fixture
`services/worker`-era `/api/projects/:id/layers/parcels` (built in the night
session) requires `project.orgId === auth.org_id` and 404s otherwise. **No
`ProjectFixture` in the entire codebase sets `orgId`** — the field is optional
and nothing populates it. This meant the route 404'd unconditionally for
every user, correctly authenticated or not, and would have kept doing so
after bug #2 was fixed.

**Fix:** set `orgId: "00000000-0000-0000-0000-000000000001"` on
`p10ParksideGeorgetown`, matching the id issued by the dev login route.
Added a regression test asserting this.

**Not fixed / flagged:** this is a systemic gap, not a one-fixture bug. Any
future project with a `basemapId` will hit the identical 404 unless someone
remembers to set `orgId` by hand. Recommend either making `orgId` required
on `ProjectFixture` when `basemapId` is set (type-level enforcement), or
deriving it from a single shared constant instead of duplicating the literal
string per fixture.

### 4. FOUND, NOT FIXED — map style never finishes loading
After fixes 1–3, `fetch()` calls to the layer routes return 200 with real
data (554 parcels, 557 addresses, verified via direct fetch from the
authenticated page). But `map.isStyleLoaded()` never became `true` in
repeated live checks (including a cold navigation with no HMR interference),
so `ensureLayers()` — which is presumably gated on style readiness — never
actually adds the parcel/address sources to the map. **The real data now
loads successfully but still does not render.**

**Root cause hypothesis (high confidence, not yet fixed or tested):**
`src/components/MapCanvas.tsx` line ~465, the "basemap switching" effect:

```ts
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;
  map.setStyle(BASEMAP_STYLES[basemap]);
}, [basemap]);
```

`basemap` is populated from mount (not undefined), so this effect fires on
the initial render too — immediately after the map constructor already set
the identical style (`style: BASEMAP_STYLES[useDesignStore.getState().basemap]`
in the init effect above it). Calling `setStyle()` again while the first
style is still loading produces the observed console warning loop
(`Unable to perform style diff: Style is not done loading.. Rebuilding the
style from scratch.`) and appears to leave the map in a permanently-loading
state.

**This was not fixed live** — deliberately. It's a rendering-pipeline change
and this session was already several live patches deep; a rushed fix risked
a new regression with no time left to verify it properly. It is the #1 item
for the next session (see the accompanying directive).

## Why unit tests missed all four bugs

Every existing test for this feature (`p10-parkside-georgetown.test.ts`,
`basemap-loader.test.ts`, `basemap-workspace.test.ts`) calls library functions
or the check registry directly — `loadParcels()`, `runSingleCheck()`, etc. None
of them go through `fetch()`, an HTTP route, real auth, or an actual mounted
`MapCanvas` component. The 189/190 passing tests were all individually true and
still described a product that could not be used. **Code correctness and
feature correctness are different claims; only one of them was ever verified
for this chunk of work until tonight.**

## Verification performed

- `npm run lint` — pre-existing warnings only, none from these changes
- `npx tsc --noEmit` — clean
- `npm test` — 190/190 passing (was 189; added 1 regression test)
- `npm run build` — clean
- Live browser, authenticated as `dev@skarion.com`: curriculum page shows
  Parkside as ACTIVE and clickable; project page loads; direct authenticated
  fetch to both layer routes returns 200 with 554/557 real features
  (verified via `fetch()` executed in-page, not mocked)
- Live browser: map canvas still does not visually render parcels/addresses
  (bug #4, open)

## Commit

Files changed: `src/app/curriculum/page.tsx`, `src/components/MapCanvas.tsx`,
`src/lib/projects/p10-parkside-georgetown.ts`,
`src/lib/projects/p10-parkside-georgetown.test.ts`, `tests/.test-floor`.
