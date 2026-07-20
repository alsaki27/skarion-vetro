import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function resolveProjectId(projectSlugOrId: string, orgId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  // Try direct UUID match first
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRe.test(projectSlugOrId)) {
    const [row] = await db.select({ id: schema.projects.id })
      .from(schema.projects)
      .where(and(eq(schema.projects.id, projectSlugOrId), eq(schema.projects.orgId, orgId)))
      .limit(1);
    if (row) return row.id;
  }

  // Try slug match (org-scoped)
  const [row] = await db.select({ id: schema.projects.id })
    .from(schema.projects)
    .where(and(eq(schema.projects.slug, projectSlugOrId), eq(schema.projects.orgId, orgId)))
    .limit(1);
  return row?.id ?? null;
}
