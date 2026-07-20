import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";

function requireDb() {
  const d = getDb();
  if (!d) throw new Error("Database not available (DATABASE_URL not configured)");
  return d;
}

export interface TenantContext {
  orgId: string;
  userId?: string;
}

function requireTenant(ctx: TenantContext): TenantContext {
  if (!ctx.orgId) throw new Error("Tenant context required: orgId missing");
  return ctx;
}

export class ProjectRepository {
  constructor(private ctx: TenantContext) { requireTenant(ctx); }

  async list() {
    return requireDb().select().from(schema.projects).where(eq(schema.projects.orgId, this.ctx.orgId));
  }

  async getById(id: string) {
    const rows = await requireDb().select().from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.orgId, this.ctx.orgId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async getBySlug(slug: string) {
    const rows = await requireDb().select().from(schema.projects)
      .where(and(eq(schema.projects.slug, slug), eq(schema.projects.orgId, this.ctx.orgId)))
      .limit(1);
    return rows[0] ?? null;
  }
}

export class DesignRepository {
  constructor(private ctx: TenantContext) { requireTenant(ctx); }

  async getElements(projectId: string) {
    return requireDb().select().from(schema.networkElements)
      .where(and(
        eq(schema.networkElements.projectId, projectId),
        eq(schema.networkElements.orgId, this.ctx.orgId),
      ));
  }

  async saveSnapshot(projectId: string, data: Record<string, unknown>, note?: string) {
    return requireDb().insert(schema.designSnapshots).values({
      orgId: this.ctx.orgId,
      projectId,
      userId: this.ctx.userId,
      snapshotData: data,
      snapshotNote: note,
    }).returning();
  }

  async listSnapshots(projectId: string) {
    return requireDb().select().from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.projectId, projectId),
        eq(schema.designSnapshots.orgId, this.ctx.orgId),
        eq(schema.designSnapshots.userId, this.ctx.userId ?? ""),
      ))
      .orderBy(desc(schema.designSnapshots.createdAt));
  }
}

export class GradingRepository {
  constructor(private ctx: TenantContext) { requireTenant(ctx); }

  async saveResult(projectId: string, userId: string, data: {
    totalScore: number;
    isPassing: boolean;
    categoryScores: Record<string, unknown>;
    feedback: Record<string, unknown>;
    phase?: "hld" | "lld";
  }) {
    return requireDb().insert(schema.gradingResults).values({
      orgId: this.ctx.orgId,
      projectId,
      userId,
      totalScore: data.totalScore,
      isPassing: data.isPassing,
      phase: data.phase ?? "hld",
      categoryScores: data.categoryScores,
      feedback: data.feedback,
    }).returning();
  }

  async getHistory(projectId: string, userId: string) {
    return requireDb().select().from(schema.gradingResults)
      .where(and(
        eq(schema.gradingResults.projectId, projectId),
        eq(schema.gradingResults.userId, userId),
        eq(schema.gradingResults.orgId, this.ctx.orgId),
      ))
      .orderBy(desc(schema.gradingResults.createdAt));
  }
}

export class OrgRepository {
  constructor(private ctx: TenantContext) { requireTenant(ctx); }

  async getMembers() {
    return requireDb().select().from(schema.orgMembers)
      .where(eq(schema.orgMembers.orgId, this.ctx.orgId));
  }

  async addMember(userId: string, role: "student" | "instructor" | "admin") {
    return requireDb().insert(schema.orgMembers).values({
      orgId: this.ctx.orgId,
      userId,
      role,
    }).onConflictDoNothing().returning();
  }
}

export class ImportRepository {
  constructor(private ctx: TenantContext) { requireTenant(ctx); }

  async listJobs() {
    return requireDb().select().from(schema.importJobs)
      .where(eq(schema.importJobs.orgId, this.ctx.orgId))
      .orderBy(desc(schema.importJobs.createdAt));
  }

  async createJob(data: {
    sourceId?: string;
    projectId?: string;
    targetLayerId?: string;
    fieldMapping?: Record<string, unknown>;
  }) {
    return requireDb().insert(schema.importJobs).values({
      orgId: this.ctx.orgId,
      sourceId: data.sourceId,
      projectId: data.projectId,
      targetLayerId: data.targetLayerId,
      fieldMapping: data.fieldMapping,
      status: "pending",
    }).returning();
  }
}
