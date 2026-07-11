import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";
import { generateId } from "./lib/id";
import { authMiddleware, type AuthPayload } from "./auth";

type Variables = {
  auth: AuthPayload;
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", cors());

function sql() {
  return neon(process.env.NEON_DATABASE_URL ?? "");
}

// ===========================================================================
// Public
// ===========================================================================

app.get("/health", (c) => c.json({ status: "ok", service: "skarion-vetro-worker" }));

// ===========================================================================
// Auth-guarded routes
// ===========================================================================

app.use("/api/*", authMiddleware);

app.get("/api/projects", async (c) => {
  try {
    const { org_id } = c.var.auth;
    const db = sql();
    const rows = await db`SELECT id, slug, title, description, difficulty, environment, split_architecture, pass_threshold FROM projects WHERE org_id = ${org_id} OR org_id IS NULL ORDER BY sort_order`;
    return c.json({ projects: rows });
  } catch (err) {
    console.error("GET /api/projects failed", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/api/projects/:slug", async (c) => {
  try {
    const { slug } = c.req.param();
    const db = sql();
    const rows = await db`SELECT * FROM projects WHERE slug = ${slug} LIMIT 1`;
    if (!rows.length) return c.json({ error: "Not found" }, 404);
    return c.json(rows[0]);
  } catch (err) {
    console.error(`GET /api/projects/${c.req.param("slug")} failed`, err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/api/designs/save", async (c) => {
  try {
    const { sub } = c.var.auth;
    const body = await c.req.json();
    const { projectId, snapshotData, note } = body;
    if (!projectId || !snapshotData) return c.json({ error: "projectId and snapshotData required" }, 400);

    const db = sql();
    const id = generateId();
    await db`
      INSERT INTO design_snapshots (id, org_id, project_id, user_id, snapshot_data, snapshot_note)
      VALUES (${id}, ${c.var.auth.org_id}, ${projectId}, ${sub}, ${JSON.stringify(snapshotData)}, ${note ?? null})
    `;
    return c.json({ id, createdAt: new Date().toISOString() }, 201);
  } catch (err) {
    console.error("POST /api/designs/save failed", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/api/designs/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const db = sql();
    const rows = await db`
      SELECT * FROM design_snapshots WHERE id = ${id} AND org_id = ${c.var.auth.org_id}
    `;
    if (!rows.length) return c.json({ error: "Not found" }, 404);
    return c.json(rows[0]);
  } catch (err) {
    console.error(`GET /api/designs/${c.req.param("id")} failed`, err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/api/progress/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const db = sql();
    const rows = await db`
      SELECT * FROM candidate_progress WHERE user_id = ${userId}
    `;
    return c.json({ progress: rows });
  } catch (err) {
    console.error(`GET /api/progress/${c.req.param("userId")} failed`, err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/api/dev/seed", async (c) => {
  try {
    const { org_id } = c.var.auth;
    const db = sql();
    await db`INSERT INTO organizations (id, name, slug, plan, status) VALUES (${org_id}, 'Skarion', 'skarion', 'pro', 'active') ON CONFLICT (slug) DO NOTHING`;
    await db`INSERT INTO users (id, email, name) VALUES (${c.var.auth.sub}, 'dev@skarion.com', 'Dev User') ON CONFLICT (email) DO NOTHING`;
    await db`INSERT INTO org_members (org_id, user_id, role) VALUES (${org_id}, ${c.var.auth.sub}, 'student') ON CONFLICT (org_id, user_id) DO NOTHING`;
    return c.json({ seeded: true, orgId: org_id, userId: c.var.auth.sub });
  } catch (err) {
    console.error("POST /api/dev/seed failed", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
