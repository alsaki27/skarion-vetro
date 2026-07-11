// Tenant-scoped project repository — all queries require TenantContext.
import { getDb, schema } from "@/db";
import { eq, and, or, isNull } from "drizzle-orm";
import type { TenantContext } from "./tenant-context";
import { NotFoundError } from "./tenant-context";
import { PROJECTS } from "@/lib/projects";

export class ProjectRepository {
  constructor(private ctx: TenantContext) {}

  async findById(id: string) {
    const db = getDb();
    if (!db) return PROJECTS[id] ?? null;
    const rows = await db.select().from(schema.projects)
      .where(and(
        eq(schema.projects.id, id),
        or(eq(schema.projects.orgId, this.ctx.orgId), isNull(schema.projects.orgId)),
      ))
      .limit(1);
    return rows[0] ?? null;
  }

  async findBySlug(slug: string) {
    const db = getDb();
    if (!db) return null;
    const rows = await db.select().from(schema.projects)
      .where(and(
        eq(schema.projects.slug, slug),
        or(eq(schema.projects.orgId, this.ctx.orgId), isNull(schema.projects.orgId)),
      ))
      .limit(1);
    return rows[0] ?? null;
  }

  async list() {
    const db = getDb();
    if (!db) return Object.values(PROJECTS);
    return db.select().from(schema.projects)
      .where(or(eq(schema.projects.orgId, this.ctx.orgId), isNull(schema.projects.orgId)))
      .orderBy(schema.projects.sortOrder);
  }

  async requireById(id: string) {
    const project = await this.findById(id);
    if (!project) throw new NotFoundError("Project");
    return project;
  }
}
