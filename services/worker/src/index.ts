import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";
import { generateId } from "./lib/id";
import { authMiddleware, type AuthPayload } from "./auth";

type Variables = { auth: AuthPayload };

const app = new Hono<{ Variables: Variables }>();

// CORS: env-configured origin allowlist, explicit methods/headers, never wildcard in production
const CORS_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:8787")
  .split(",").map((s: string) => s.trim());
app.use("*", cors({
  origin: CORS_ORIGINS,
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  exposeHeaders: ["X-Request-Id"],
}));

function sql() {
  return neon(process.env.NEON_DATABASE_URL ?? "");
}

// Explicit public-column DTO — never SELECT *, never returns optimal_design or grading secrets
function safeProjectDto(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    environment: row.environment,
    split_architecture: row.split_architecture,
    pass_threshold: row.pass_threshold,
    location_name: row.location_name,
    map_center: row.map_center,
    map_zoom: row.map_zoom,
    constraints: row.constraints,
    existing_infrastructure: row.existing_infrastructure,
    is_active: row.is_active,
  };
}

function safeDesignDto(row: Record<string, unknown>) {
  return {
    id: row.id,
    project_id: row.project_id,
    user_id: row.user_id,
    snapshot_note: row.snapshot_note,
    created_at: row.created_at,
  };
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
    const rows = await db`
      SELECT id, slug, title, description, difficulty, environment, split_architecture, pass_threshold
      FROM projects WHERE org_id = ${org_id} OR org_id IS NULL ORDER BY sort_order
    `;
    return c.json({ projects: rows });
  } catch (err) {
    console.error("GET /api/projects failed", err);
    return c.json({ error: "Internal server error", error_code: "INTERNAL_ERROR" }, 500);
  }
});

app.get("/api/projects/:slug", async (c) => {
  try {
    const { slug } = c.req.param();
    const { org_id } = c.var.auth;
    const db = sql();
    const rows = await db`
      SELECT id, slug, title, description, difficulty, environment, split_architecture,
             pass_threshold, location_name, map_center, map_zoom, constraints,
             existing_infrastructure, is_active
      FROM projects WHERE slug = ${slug} AND (org_id = ${org_id} OR org_id IS NULL) LIMIT 1
    `;
    if (!rows.length) return c.json({ error: "Not found", error_code: "NOT_FOUND" }, 404);
    return c.json(safeProjectDto(rows[0]));
  } catch (err) {
    console.error(`GET /api/projects/${c.req.param("slug")} failed`, err);
    return c.json({ error: "Internal server error", error_code: "INTERNAL_ERROR" }, 500);
  }
});

app.post("/api/designs/save", async (c) => {
  try {
    const { sub, org_id } = c.var.auth;
    const body = await c.req.json();
    const { projectId, snapshotData, note } = body;
    if (!projectId || !snapshotData) return c.json({ error: "projectId and snapshotData required", error_code: "VALIDATION_ERROR" }, 400);

    const db = sql();
    const id = generateId();
    await db`
      INSERT INTO design_snapshots (id, org_id, project_id, user_id, snapshot_data, snapshot_note)
      VALUES (${id}, ${org_id}, ${projectId}, ${sub}, ${JSON.stringify(snapshotData)}, ${note ?? null})
    `;
    return c.json({ id, createdAt: new Date().toISOString() }, 201);
  } catch (err) {
    console.error("POST /api/designs/save failed", err);
    return c.json({ error: "Internal server error", error_code: "INTERNAL_ERROR" }, 500);
  }
});

app.get("/api/designs/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const { sub, org_id, role } = c.var.auth;
    const db = sql();

    let rows;
    if (role === "student") {
      rows = await db`
        SELECT id, project_id, user_id, snapshot_note, created_at
        FROM design_snapshots WHERE id = ${id} AND org_id = ${org_id} AND user_id = ${sub}
      `;
    } else {
      rows = await db`
        SELECT id, project_id, user_id, snapshot_note, created_at
        FROM design_snapshots WHERE id = ${id} AND org_id = ${org_id}
      `;
    }

    if (!rows.length) return c.json({ error: "Not found", error_code: "NOT_FOUND" }, 404);
    return c.json(safeDesignDto(rows[0]));
  } catch (err) {
    console.error(`GET /api/designs/${c.req.param("id")} failed`, err);
    return c.json({ error: "Internal server error", error_code: "INTERNAL_ERROR" }, 500);
  }
});

app.get("/api/progress/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const { sub, org_id, role } = c.var.auth;

    if (role === "student" && userId !== sub) {
      return c.json({ error: "Forbidden", error_code: "FORBIDDEN" }, 403);
    }

    const db = sql();
    const rows = await db`
      SELECT user_id, project_id, status, time_spent_minutes, attempts, best_score, started_at, completed_at
      FROM candidate_progress WHERE user_id = ${userId} AND org_id = ${org_id}
    `;
    return c.json({ progress: rows });
  } catch (err) {
    console.error(`GET /api/progress/${c.req.param("userId")} failed`, err);
    return c.json({ error: "Internal server error", error_code: "INTERNAL_ERROR" }, 500);
  }
});

export default app;
