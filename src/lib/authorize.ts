import { ForbiddenError } from "./errors";
import { writeAudit } from "./audit";

export type Role = "student" | "instructor" | "admin";

export type Capability =
  | "member.invite"
  | "member.manage"
  | "cohort.manage"
  | "project.create"
  | "project.publish"
  | "assignment.manage"
  | "design.edit_own"
  | "design.review_assigned"
  | "grade.override"
  | "audit.read"
  | "billing.manage"
  | "org.settings"
  | "support.access";

interface AuthContext {
  userId: string;
  orgId: string;
  role: Role;
  isPlatformStaff: boolean;
}

const ROLE_CAPABILITIES: Record<Role, Set<Capability>> = {
  student: new Set([]),
  instructor: new Set([
    "member.invite",
    "cohort.manage",
    "assignment.manage",
    "design.review_assigned",
    "grade.override",
  ]),
  admin: new Set([
    "member.invite",
    "member.manage",
    "cohort.manage",
    "project.create",
    "project.publish",
    "assignment.manage",
    "design.review_assigned",
    "grade.override",
    "audit.read",
    "org.settings",
    "billing.manage",
  ]),
};

export function authorize(
  ctx: AuthContext,
  capability: Capability,
  resource?: { orgId?: string; ownerId?: string },
): void {
  // Platform staff can do anything (explicit support mode)
  if (ctx.isPlatformStaff && capability === "support.access") return;

  // Check org scope
  if (resource?.orgId && resource.orgId !== ctx.orgId) {
    writeAudit({
      action: "support.access",
      actorUserId: ctx.userId,
      orgId: resource.orgId,
      entityType: "authorization",
      metadata: { deniedCapability: capability, userOrgId: ctx.orgId },
    });
    throw new ForbiddenError("Cross-organization access denied");
  }

  // Students can always edit their own designs regardless of role check
  if (capability === "design.edit_own" && resource?.ownerId === ctx.userId) return;

  // Check role capability
  const allowed = ROLE_CAPABILITIES[ctx.role];
  if (!allowed || !allowed.has(capability)) {
    throw new ForbiddenError(`Missing capability: ${capability}`);
  }
}

export function assertRole(
  ctx: AuthContext,
  ...roles: Role[]
): void {
  if (!roles.includes(ctx.role)) {
    throw new ForbiddenError(`Requires one of: ${roles.join(", ")}`);
  }
}
