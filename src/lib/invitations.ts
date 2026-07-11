import { getDb, schema } from "@/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { writeAudit } from "./audit";
import { NotFoundError, ConflictError, ForbiddenError } from "./errors";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a token for storage using a HMAC-like approach with JWT_SECRET.
 * The raw token is returned to the inviter; only the hash is stored server-side.
 */
function hashToken(token: string): string {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  let hash = 0;
  const data = secret + ":" + token;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export interface CreateInviteInput {
  orgId: string;
  email: string;
  role: "student" | "instructor" | "admin";
  inviterId: string;
  inviterRole: "student" | "instructor" | "admin";
}

export interface InviteResult {
  token: string;
  expiresAt: string;
}

export async function createInvite(input: CreateInviteInput): Promise<InviteResult> {
  const db = getDb();

  // Instructors cannot invite admins
  if (input.role === "admin" && input.inviterRole === "instructor") {
    throw new ForbiddenError("Instructors cannot invite organization admins");
  }

  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  if (db) {
    // Check for existing active invitation for this email + org
    const existing = await db
      .select({ id: schema.organizationInvitations.id })
      .from(schema.organizationInvitations)
      .where(
        and(
          eq(schema.organizationInvitations.orgId, input.orgId),
          eq(schema.organizationInvitations.email, input.email.toLowerCase()),
          isNull(schema.organizationInvitations.acceptedAt),
          isNull(schema.organizationInvitations.revokedAt),
          sql`${schema.organizationInvitations.expiresAt} > NOW()`,
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("An active invitation already exists for this email in this organization");
    }

    await db.insert(schema.organizationInvitations).values({
      orgId: input.orgId,
      email: input.email.toLowerCase(),
      role: input.role,
      tokenHash,
      inviterId: input.inviterId,
      expiresAt,
    });
  }

  await writeAudit({
    action: "invitation.create",
    actorUserId: input.inviterId,
    orgId: input.orgId,
    entityType: "organization_invitation",
    metadata: { email: input.email, role: input.role },
  });

  return { token, expiresAt: expiresAt.toISOString() };
}

export interface AcceptInviteInput {
  token: string;
  name: string;
  hashedPassword: string;
}

export async function acceptInvite(input: AcceptInviteInput) {
  const db = getDb();
  if (!db) {
    throw new Error("Database required for invite acceptance");
  }

  const tokenHash = hashToken(input.token);
  const [invite] = await db
    .select()
    .from(schema.organizationInvitations)
    .where(
      and(
        eq(schema.organizationInvitations.tokenHash, tokenHash),
        isNull(schema.organizationInvitations.acceptedAt),
        isNull(schema.organizationInvitations.revokedAt),
        sql`${schema.organizationInvitations.expiresAt} > NOW()`,
      ),
    )
    .limit(1);

  if (!invite) {
    throw new NotFoundError("Invite token");
  }

  // Upsert the user (may already exist from another org)
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, invite.email))
    .limit(1);

  let userId: string;
  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    // Update password hash if provided
    if (input.hashedPassword) {
      await db
        .update(schema.users)
        .set({ passwordHash: input.hashedPassword })
        .where(eq(schema.users.id, userId));
    }
  } else {
    const [user] = await db
      .insert(schema.users)
      .values({
        email: invite.email,
        name: input.name || invite.email.split("@")[0],
        passwordHash: input.hashedPassword,
      })
      .returning();
    userId = user.id;
  }

  // Check if membership already exists (user may be re-joining)
  const existingMembership = await db
    .select()
    .from(schema.orgMembers)
    .where(
      and(
        eq(schema.orgMembers.orgId, invite.orgId),
        eq(schema.orgMembers.userId, userId),
      ),
    )
    .limit(1);

  if (existingMembership.length > 0) {
    // Reactivate if deactivated
    if (existingMembership[0].status === "deactivated") {
      await db
        .update(schema.orgMembers)
        .set({ status: "active" })
        .where(
          and(
            eq(schema.orgMembers.orgId, invite.orgId),
            eq(schema.orgMembers.userId, userId),
          ),
        );
    }
    // Role stays as originally assigned — don't overwrite existing role
  } else {
    await db.insert(schema.orgMembers).values({
      orgId: invite.orgId,
      userId,
      role: invite.role,
      status: "active",
    });
  }

  // Mark invite accepted
  await db
    .update(schema.organizationInvitations)
    .set({ acceptedAt: new Date() })
    .where(eq(schema.organizationInvitations.id, invite.id));

  await writeAudit({
    action: "invitation.accept",
    actorUserId: userId,
    orgId: invite.orgId,
    entityType: "organization_invitation",
    entityId: invite.id,
  });

  return { userId, email: invite.email, orgId: invite.orgId, role: invite.role };
}

export async function revokeInvite(inviteId: string, orgId: string, actorUserId: string) {
  const db = getDb();
  if (!db) throw new Error("Database required");

  const result = await db
    .update(schema.organizationInvitations)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.organizationInvitations.id, inviteId),
        eq(schema.organizationInvitations.orgId, orgId),
        isNull(schema.organizationInvitations.acceptedAt),
        isNull(schema.organizationInvitations.revokedAt),
      ),
    );

  await writeAudit({
    action: "invitation.revoke",
    actorUserId,
    orgId,
    entityType: "organization_invitation",
    entityId: inviteId,
  });

  return result;
}
