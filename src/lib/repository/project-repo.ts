import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import type { ProjectFixture } from "../types";
import { PROJECTS } from "../projects";

const PUBLIC_FIELD_NAMES = [
  "id", "title", "difficulty", "environment", "splitArchitecture",
  "mapCenter", "mapZoom", "preloadedElements", "requirements",
  "constraints", "constraintNotes", "deliverables", "scenario",
  "tasks", "tip", "optimalStats", "passThreshold",
] as const;

export function sanitizeProject(p: ProjectFixture): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of PUBLIC_FIELD_NAMES) {
    sanitized[key] = (p as unknown as Record<string, unknown>)[key];
  }
  return sanitized;
}

export const projectRepository = {
  /**
   * List all projects visible to an organization.
   * Falls back to fixture-defined projects when no database is configured.
   */
  async listForOrg(orgId: string) {
    const db = getDb();
    if (!db) {
      return Object.values(PROJECTS).map(sanitizeProject);
    }

    const rows = await db
      .select()
      .from(schema.projects)
      .where(
        and(
          eq(schema.projects.orgId, orgId),
          eq(schema.projects.isActive, true),
        ),
      )
      .orderBy(schema.projects.sortOrder);

    return rows;
  },

  /**
   * Get a single project by slug, scoped to org.
   */
  async getBySlug(orgId: string, slug: string) {
    const db = getDb();
    if (!db) {
      const project = Object.values(PROJECTS).find((p) => p.id === slug);
      return project ? sanitizeProject(project) : null;
    }

    const rows = await db
      .select()
      .from(schema.projects)
      .where(
        and(eq(schema.projects.orgId, orgId), eq(schema.projects.slug, slug)),
      )
      .limit(1);

    return rows.length > 0 ? rows[0] : null;
  },
};
