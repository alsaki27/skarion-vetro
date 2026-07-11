import { getDb, schema } from "@/db";
import { logger } from "./logger";

type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.refresh"
  | "invitation.create"
  | "invitation.accept"
  | "invitation.revoke"
  | "invitation.resend"
  | "member.role_change"
  | "member.deactivate"
  | "member.reactivate"
  | "member.remove"
  | "project.create"
  | "project.update"
  | "project.publish"
  | "project.archive"
  | "assignment.create"
  | "assignment.update"
  | "assignment.close"
  | "submission.create"
  | "grade.override"
  | "review.approve"
  | "review.revision"
  | "review.exception"
  | "export.create"
  | "support.access";

export interface AuditEvent {
  action: AuditAction;
  actorUserId: string;
  orgId: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAudit(event: AuditEvent): Promise<void> {
  try {
    const db = getDb();
    if (!db) {
      logger.info("Audit event (no DB)", { action: event.action, orgId: event.orgId });
      return;
    }

    await db.insert(schema.auditLog).values({
      orgId: event.orgId,
      actorUserId: event.actorUserId,
      action: event.action,
      entityType: event.entityType ?? null,
      entityId: event.entityId ?? null,
      metadata: (event.metadata ?? {}) as Record<string, unknown>,
    });
  } catch (err) {
    // Audit failures must never break the calling operation
    logger.error("Audit write failed", {
      action: event.action,
      error: String(err),
    });
  }
}
