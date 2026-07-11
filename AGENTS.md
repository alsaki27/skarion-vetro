<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Skarion-VETRO — AI Agent Guide

## Project overview

Skarion-VETRO is an OSP fiber network design training platform. Students design
fiber networks on a MapLibre canvas, submit for deterministic grading, and
iterate until passing.

## Codebase conventions

### Project structure

- `src/app/` — Next.js App Router pages + API routes
- `src/components/` — React components (all "use client" where interactive)
- `src/lib/` — Pure logic: grading engine, project fixtures, geometry, auth, types
- `src/db/` — Drizzle ORM schema and connection
- `services/worker/` — Separate Cloudflare Worker (Hono), not bundled with Next.js

### TypeScript

- Strict mode is enabled
- Network elements use discriminated union types: `PointElement | LineElement`
- Grading checks are typed via `CheckDef` (id, category, run function)
- Avoid `any` — prefer `Record<string, unknown>` or branded types

### State management

- Zustand store (`src/lib/store.ts`) is the single source of truth for design state
- Components subscribe with selectors (`useDesignStore(s => s.elements)`) — never
  access store outside React render cycle unless via `getState()`
- Undo/redo uses snapshot history (past/future arrays of elements records)

### Styling

- Tailwind CSS v4 with `@theme inline` tokens
- Dark theme: `bg-zinc-950` background, `text-zinc-100` text
- Geist font via `next/font`
- Do NOT add inline `<style>` tags — use Tailwind utilities

### API routes

Pattern for all Next.js API routes:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();
  try {
    // ... handler logic
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

Always use `getAuthFromRequest` for auth, always wrap in try/catch, and always
validate input (prefer zod — already a dependency).

## Grading engine

The heart of the platform. Located at `src/lib/grading/engine.ts`.

### Architecture

```
elements → buildContext() → DesignContext
                                ↓
                    CHECK_REGISTRY (13+ checks)
                                ↓
                    runGrading() → GradingResult
```

- `buildContext()` creates a `DesignContext` with points, lines, graph
  (adjacency), and containment map
- Each check is a `CheckDef` with an id, category, and run function
- `runGrading()` runs only checks that have weights in `project.gradingWeights`
- Results are deterministic — no AI, no randomness

### Adding a new check

1. Define the check in `engine.ts` following the `CheckDef` interface
2. Add it to `CHECK_REGISTRY`
3. Add a weight in the project fixture's `gradingWeights` field
4. (Optional) Add the checkId to a project's `requirements` array for live
   dry-run feedback in the side panel

## Projects

9 fixtures in `src/lib/projects/`, each typed as `ProjectFixture`:

```ts
interface ProjectFixture {
  id: string;
  title: string;
  environment: "aerial" | "underground" | "mixed";
  difficulty: "beginner" | "intermediate" | "advanced";
  constraints: { maxPoleSpanFt, maxDropCableFt, minCableCount };
  gradingWeights: Record<string, number>;   // checkId → weight
  preloadedElements: NetworkElement[];       // scenario fixtures
  optimalStats: { totalCableFt: number };   // efficiency benchmark
  passThreshold: number;
  requirements: { id, label, checkId }[];
}
```

## Docker / sidecars

### Cloudflare Worker (`services/worker/`)

- Separate deploy from the Next.js app
- JWT auth middleware at `services/worker/src/auth.ts`
- Endpoints: projects, designs/save, designs/:id, progress, dev/seed
- Does NOT handle grading (Next.js handles it client-side)
- Deploy with `npm run deploy` in the worker directory

### DWG ingest (`scripts/dwg-pipeline/`)

- Python CLI prototype, not part of the Next.js bundle
- Status webhook receiver at `src/app/api/dwg/status/route.ts`

## Common tasks

### I need to add a new project

1. Create `src/lib/projects/pN-name.ts` with a `ProjectFixture`
2. Export from `src/lib/projects/index.ts`
3. Add grading weights referencing existing check IDs
4. Add to the dashboard list in `src/app/curriculum/page.tsx`

### I need a new grading check

1. Define the `CheckDef` in `src/lib/grading/engine.ts`
2. Register it in `CHECK_REGISTRY`
3. Add a weight to the relevant project fixtures

### I need to add a new API route

1. Create `src/app/api/<name>/route.ts`
2. Follow the pattern (auth, db, try/catch, zod validation)
3. If it needs worker parity, also add to `services/worker/src/index.ts`

### I need to modify the map

- Map initialization is in `MapCanvas.tsx` — the only component with map access
- Drawing tools dispatch to Zustand store actions
- MapLibre sources are lazily created on `load` / `styledata` events
- Basemap layers render below design layers

## Don't

- Don't add new npm dependencies without checking if the functionality already
  exists (e.g., `jose` for JWT, `turf` for geometry)
- Don't use `uuid` package — use `crypto.randomUUID()`
- Don't add `console.log` to production API routes — use structured logging
- Don't bypass the Zustand store (no direct DOM manipulation of element state)
- Don't skip input validation on API routes — uses `zod` (already installed)
