# ADR 0001 — Platform boundary and architecture foundations

**Status:** Accepted  
**Date:** 2026-07-11  
**Drivers:** SaaS multi-tenant requirements, deterministic grading authority, separation of curriculum from student work

## Context

Skarion-VETRO began as a single-user educational prototype with hardcoded
project fixtures, client-side grading, and in-memory state. Moving to a
multi-tenant SaaS requires explicit architectural boundaries.

## Decision

1. **Next.js web application** serves as the primary student and instructor UI,
   authenticated server routes, and orchestration layer.

2. **PostgreSQL/PostGIS** is the single source of truth for tenant,
   curriculum, assignment, design, topology, progress, grading, comments, and
   audit data.

3. **Object storage (Cloudflare R2 / S3)** holds DWG/DXF uploads, normalized
   basemaps, images, exports, and immutable generated artifacts.

4. **Background worker (Cloudflare Worker)** handles DWG conversion, spatial
   validation at scale, export generation, and analytics aggregation.

5. **Deterministic domain engine** (geometry, topology, validation, gating,
   grading) lives in server-shared TypeScript modules — never in the client
   bundle for authoritative operations.

6. **AI is optional and bounded** — curated explanations and rubric suggestions
   only. Deterministic checks remain authoritative.

## Consequences

- The grading engine must be importable by both the Next.js server API and the
  Worker. Client-side rendering of check results is acceptable only for live
  preview, never for authoritative scoring.
- All tenant-owned rows require a non-null `org_id`.
- Published curriculum versions are immutable.
- Student designs are pinned to one project version and one assignment.
