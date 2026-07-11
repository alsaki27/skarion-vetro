// Tenant-scoped design repository.
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import type { TenantContext } from "./tenant-context";

export class DesignRepository {
  constructor(private ctx: TenantContext) {}

  async findById(id: string) {
    const db = getDb();
    if (!db) return null;
    const conditions = [eq(schema.designSnapshots.id, id), eq(schema.designSnapshots.orgId, this.ctx.orgId)];
    if (this.ctx.role === "student") {
      conditions.push(eq(schema.designSnapshots.userId, this.ctx.userId));
    }
    const rows = await db.select().from(schema.designSnapshots).where(and(...conditions)).limit(1);
    return rows[0] ?? null;
  }

  async create(data: { projectId: string; snapshotData: unknown; note?: string }) {
    const db = getDb();
    if (!db) throw new Error("Database required for design persistence");
    const [result] = await db.insert(schema.designSnapshots).values({
      orgId: this.ctx.orgId,
      projectId: data.projectId,
      userId: this.ctx.userId,
      snapshotData: data.snapshotData as Record<string, unknown>,
      snapshotNote: data.note,
    }).returning();
    return result;
  }
}
