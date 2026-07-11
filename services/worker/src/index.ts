// Skarion-VETRO Worker — Hono API for Chunk 4 (Backend Foundation)
// Separate Cloudflare Worker deploy, not bundled with the Next.js app.
// Auth (Chunk 5) is NOT yet enforced — this chunk uses a hardcoded dev org/user.

import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";
import { generateId } from "./lib/id";

const app = new Hono();

app.use("*", cors());

// Hardcoded dev context for Chunk 4 (replaced by JWT middleware in Chunk 5)
const DEV_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

function sql() {
  return neon(process.env.NEON_DATABASE_URL ?? "");
}

function scopedOrg() {
  return DEV_ORG_ID;
}

// ===========================================================================
// Health
// ===========================================================================

app.get("/health", (c) => c.json({ status: "ok", service: "skarion-vetro-worker" }));

// ===========================================================================
// Projects
// ===========================================================================

app.get("/api/projects", async (c) => {
  const orgId = scopedOrg();
  const db = sql();
  const rows = await db`SELECT id, slug, title, description, difficulty, environment, split_architecture, pass_threshold FROM projects WHERE org_id = ${orgId} OR org_id IS NULL ORDER BY sort_order`;
  return c.json({ projects: rows });
});

app.get("/api/projects/:slug", async (c) => {
  const { slug } = c.req.param();
  const db = sql();
  const rows = await db`SELECT * FROM projects WHERE slug = ${slug} LIMIT 1`;
  if (!rows.length) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

// ===========================================================================
// Designs (auto-save ≤30s)
// ===========================================================================

app.post("/api/designs/save", async (c) => {
  const orgId = scopedOrg();
  const body = await c.req.json();
  const { projectId, snapshotData, note } = body;
  if (!projectId || !snapshotData) return c.json({ error: "projectId and snapshotData required" }, 400);

  const db = sql();
  const id = generateId();
  await db`
    INSERT INTO design_snapshots (id, org_id, project_id, user_id, snapshot_data, snapshot_note)
    VALUES (${id}, ${orgId}, ${projectId}, ${DEV_USER_ID}, ${JSON.stringify(snapshotData)}, ${note ?? null})
  `;
  return c.json({ id, createdAt: new Date().toISOString() }, 201);
});

app.get("/api/designs/:id", async (c) => {
  const { id } = c.req.param();
  const orgId = scopedOrg();
  const db = sql();
  const rows = await db`
    SELECT * FROM design_snapshots WHERE id = ${id} AND org_id = ${orgId}
  `;
  if (!rows.length) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

// ===========================================================================
// Grading (server-side)
// ===========================================================================

app.post("/api/grading/submit", async (c) => {
  const orgId = scopedOrg();
  const body = await c.req.json();
  const { projectId, elements } = body;
  if (!projectId || !elements) return c.json({ error: "projectId and elements required" }, 400);

  // For now, return a placeholder — server-side grading via the shared check registry
  // will be wired in once the Worker can import src/lib/grading/engine.ts
  const db = sql();
  const id = generateId();
  await db`
    INSERT INTO grading_results (id, org_id, project_id, user_id, total_score, is_passing, phase, category_scores, feedback)
    VALUES (${id}, ${orgId}, ${projectId}, ${DEV_USER_ID}, 0, false, 'hld', '{}'::jsonb, '[]'::jsonb)
  `;
  return c.json({ id, totalScore: 0, isPassing: false, message: "Server-side grading not yet wired — use client engine" }, 202);
});

// ===========================================================================
// Progress
// ===========================================================================

app.get("/api/progress/:userId", async (c) => {
  const { userId } = c.req.param();
  const db = sql();
  const rows = await db`
    SELECT * FROM candidate_progress WHERE user_id = ${userId}
  `;
  return c.json({ progress: rows });
});

// ===========================================================================
// Seed helper (dev only)
// ===========================================================================

app.post("/api/dev/seed", async (c) => {
  const orgId = scopedOrg();
  const db = sql();

  await db`INSERT INTO organizations (id, name, slug, plan, status) VALUES (${orgId}, 'Skarion', 'skarion', 'pro', 'active') ON CONFLICT (slug) DO NOTHING`;
  await db`INSERT INTO users (id, email, name) VALUES (${DEV_USER_ID}, 'dev@skarion.com', 'Dev User') ON CONFLICT (email) DO NOTHING`;
  await db`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgId}, ${DEV_USER_ID}, 'student') ON CONFLICT (org_id, user_id) DO NOTHING`;

  return c.json({ seeded: true, orgId, userId: DEV_USER_ID });
});

export default app;
