# Skarion-VETRO

**AI-guided OSP fiber network design training** — an open-source educational platform where students build real outside-plant (OSP) fiber designs on a live map and receive instant deterministic grading.

![Build Status](https://img.shields.io/badge/build-passing-22c55e)
![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-8b5cf6)

---

## Goals

- **Teach OSP fiber design** through 9 progressively challenging projects (P1–P9) spanning aerial, underground, and mixed environments
- **Provide instant feedback** via a deterministic rule engine with 13+ checks across connectivity, compliance, efficiency, containment, and low-level design
- **Simulate real design gates** — pass HLD (high-level design) to unlock LLD (low-level design) with splice tables and fiber assignments
- **Build a portfolio** — export completed designs as structured JSON

## Quick start

```bash
git clone https://github.com/alsaki27/skarion-vetro.git
cd skarion-vetro
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Navigate to **Curriculum** to pick a project and start designing.

### Prerequisites

- **Node.js** ≥20
- A **Neon (PostgreSQL)** database URL for persistence (optional — grading works fully client-side without a database)

### Environment variables

Copy `.env.example` (create one if missing):

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=a-32-byte-long-secret-string-change-me
```

The app runs without `DATABASE_URL` — grading and the design canvas work entirely client-side. The database enables multi-tenant auth, design persistence, and instructor dashboards.

## Architecture

```
skarion-vetro/
├── src/                          # Next.js app (primary frontend + API)
│   ├── app/                      # App Router pages & API routes
│   │   ├── page.tsx              # Marketing landing page
│   │   ├── curriculum/           # Project dashboard
│   │   ├── project/[id]/         # Design canvas per project
│   │   └── api/                  # REST endpoints (auth, grading, designs, DWG)
│   ├── components/               # React components
│   │   ├── MapCanvas.tsx         # MapLibre design canvas
│   │   ├── SidePanel.tsx         # Properties, grading, LLD, dashboard tabs
│   │   ├── ScoreCard.tsx         # Grading results display
│   │   ├── SpliceTable.tsx       # LLD fiber assignment editor
│   │   ├── ContainmentTree.tsx   # Equipment hierarchy viewer
│   │   ├── Toolbar.tsx           # Drawing tool palette
│   │   └── ...                   # BriefModal, InstructorDashboard, PortfolioExport
│   ├── lib/
│   │   ├── grading/engine.ts     # 13+ deterministic check registry
│   │   ├── projects/             # P1–P9 project fixtures
│   │   ├── basemap/              # GeoJSON reference layer loader
│   │   ├── auth/                 # JWT tokens, password hashing
│   │   ├── store.ts              # Zustand design state
│   │   ├── types.ts              # Network element & project types
│   │   ├── geometry.ts           # Distance, snapping utilities
│   │   └── storage.ts            # R2/S3 client
│   └── db/                       # Drizzle ORM schema
├── services/worker/              # Cloudflare Worker sidecar
│   └── src/
│       ├── index.ts              # Hono API (projects, designs, progress)
│       └── auth.ts               # JWT verification middleware
├── scripts/
│   ├── seed-db.ts                # Database seed script
│   ├── dwg-pipeline/             # DWG → GeoJSON prototype
│   └── verify-*.ts               # Grading & containment verification scripts
└── drizzle.config.ts
```

### Key technologies

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Map | [MapLibre GL JS](https://maplibre.org/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database | [Neon (PostgreSQL)](https://neon.tech/) + [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | [jose](https://github.com/panva/jose) (JWT), [argon2](https://github.com/ranisalt/node-argon2) (password hashing) |
| API (Worker) | [Hono](https://hono.dev/) on Cloudflare Workers |
| Geometry | [Turf.js](https://turfjs.org/) |
| Fonts | [Geist](https://vercel.com/font) via `next/font` |

## Key features

### Grading engine (`src/lib/grading/engine.ts`)

A deterministic rule engine with 13+ checks in 5 categories:

- **Connectivity** — coverage, connectivity, mainline, conduit connectivity
- **Compliance** — pole spans (max 300ft), drop cables (max 150ft), fiber counts
- **Efficiency** — total cable length vs. instructor optimal (per-project)
- **Containment** — container capacity, equipment hosting, conduit terminus, flowerpot rules
- **LLD** — split ratio validity, fiber assignment completeness

All checks are pure functions over a `DesignContext` (elements + graph + containment map). No AI is used in grading — every score is deterministic and auditable.

### Projects (P1–P9)

9 project fixtures in `src/lib/projects/`:

| Project | Environment | Difficulty |
|---|---|---|
| P1: Greenfield Build | Aerial | Beginner |
| P2: Oakwood Underground | Underground | Beginner |
| P3: Sunset Ridge Aerial | Aerial | Intermediate |
| P4: Split Architecture Lab | Aerial | Intermediate |
| P5: Splice Table Master | Mixed | Advanced |
| P6: Pole Loading & Make-Ready | Aerial | Advanced |
| P7: Parkview MDU | Mixed | Advanced |
| P8: Westside Village HLD | Mixed | Capstone |
| P9: Riverside Crossing | Mixed | Capstone |

Each project includes pre-loaded elements, constraints (max spans, fiber counts, drop lengths), grading weights, and an optimal solution for efficiency benchmarking.

### Design canvas (`MapCanvas.tsx`)

- MapLibre GL with satellite/street basemap toggles
- Drawing tools: poles, handholes, vaults, flowerpots, cable, conduit, drop cable, splitters, MSTs, FDH cabinets, splice closures, risers
- Snap-to-element for precision routing
- Undo/redo history (50 snapshots)
- Basemap reference layer overlay (EOP, CL, RW, PARCEL, BOUNDARY)

### LLD mode (`SpliceTable.tsx`)

Unlocked per-project after passing the HLD grade threshold. Features:
- Cable selection with fiber count (6–144 count)
- Tube color grid for adding fibers
- Assign A-end/B-end to splice closures, handholes, MSTs, splitters
- Splice point view grouped by closure

### Containment (`ContainmentTree.tsx`, `SidePanel.tsx`)

- Host MSTs, splitters, splice closures, and slack loops inside handholes, vaults, and FDH cabinets
- Visual capacity bar with configurable max-hosted limits
- Drag-to-eject or delete hosted equipment
- Nesting via the containment tree schematic

### DWG ingest (`scripts/dwg-pipeline/`, `src/app/api/dwg/status/`)

Prototype pipeline for converting real survey DWG files into GeoJSON basemap layers via AutoCAD → DXF → extracted/reprojected layers. Production implementation targets a FastAPI sidecar with ODA File Converter.

## Development

### Scripts

```bash
npm run dev                 # Start Next.js dev server (port 3000)
npm run build               # Production build
npm run lint                # ESLint
npm run typecheck           # TypeScript type checking (tsc --noEmit)
npm test                    # Run all Vitest unit tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # Playwright end-to-end tests
npm run test:coverage       # Tests with coverage report
npm run verify              # Lint + typecheck + test + build
npm run db:generate         # Generate Drizzle migrations
npm run db:push             # Push schema to database
npm run db:migrate          # Apply migrations
npm run db:seed             # Seed database (requires DATABASE_URL)
```

All commits must pass `npm run verify` before push.

### Worker (sidecar)

```bash
cd services/worker
npm install
npm run dev          # wrangler dev (port 8787)
npm run deploy       # wrangler deploy
```

Requires a Cloudflare account and `NEON_DATABASE_URL` + `JWT_SECRET` configured.

## How to improve

### High-impact areas

1. **Add tests** — the codebase has zero tests. Start with unit tests for the grading engine (`src/lib/grading/engine.ts`), then add integration tests for API routes.
2. **Auth endpoints** — implement `/api/auth/refresh` (token refresh) and `/api/auth/logout`. The `createRefreshToken` function exists in `src/lib/auth/tokens.ts` but has no consuming route.
3. **Input validation** — `zod` is already a dependency but unused. Add schema validation to every API route (`src/app/api/*/route.ts`).
4. **Error boundaries** — add React error boundaries around `MapCanvas` and `SidePanel` so a component crash doesn't take down the page.
5. **In-memory invite tokens** — `INVITE_TOKENS` in the auth routes is a module-level `Map`. Move to a database-backed table for production.

### Medium-impact areas

- **Worker grading** — the Next.js app handles grading client-side. The Worker's `/api/grading/submit` was removed as redundant. If you need server-side grading, import the check registry into the Worker bundle.
- **PDF export** — `PortfolioExport.tsx` currently only does JSON export. Add PDF generation.
- **Instructor dashboard** — `InstructorDashboard.tsx` shows struggle analytics but attempt history is a stub. Wire it to the `grading_results` and `design_attempts` tables.
- **Containment tree nesting** — `ContainmentTree.tsx` flattens nested hierarchies. Add recursive rendering for deeply nested containers.

### Low-impact polish

- Remove `uuid` dependency — `crypto.randomUUID()` is used everywhere; `uuid` is dead weight
- Remove unused types (`FiberAssignment`, `SpliceTableRow` in `src/lib/types.ts`)
- Add `Escape` key handler and scroll lock to `BriefModal`
- Add loading state to `project/[id]/page.tsx` before elements are loaded

## License

MIT
