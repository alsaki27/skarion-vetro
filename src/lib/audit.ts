// Audit log helper — writes structured events to the audit_log table.
import { getDb, schema } from "@/db";

export interface AuditEvent {
  orgId?: string;
  actorUserId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAudit(event: AuditEvent): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(schema.auditLog).values({
      orgId: event.orgId,
      actorUserId: event.actorUserId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: (event.metadata ?? {}) as Record<string, unknown>,
    });
  } catch {
    // Fail open — audit failures should not break the calling operation
  }
}
