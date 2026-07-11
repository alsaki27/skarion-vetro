import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { hashPassword, createAccessToken, createRefreshToken } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import crypto from "crypto";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { invite_token, password, name } = await request.json();
    if (!invite_token || !password) {
      return NextResponse.json({ error: "invite_token and password required", error_code: "VALIDATION_ERROR" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters", error_code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Invitation acceptance requires a database connection", error_code: "SERVICE_UNAVAILABLE" }, { status: 503 });
    }

    const tokenHash = hashToken(invite_token);
    const [invite] = await db.select().from(schema.organizationInvitations)
      .where(and(
        eq(schema.organizationInvitations.tokenHash, tokenHash),
        eq(schema.organizationInvitations.status, "pending"),
      ))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "Invalid or expired invite token", error_code: "INVALID_INVITE" }, { status: 400 });
    }

    if (new Date() > invite.expiresAt) {
      await db.update(schema.organizationInvitations)
        .set({ status: "expired" })
        .where(eq(schema.organizationInvitations.id, invite.id));
      return NextResponse.json({ error: "Invite token expired", error_code: "INVITE_EXPIRED" }, { status: 400 });
    }

    // Check if user already exists
    const [existingUser] = await db.select().from(schema.users)
      .where(eq(schema.users.email, invite.email)).limit(1);

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      // Add membership to new org if not already a member
      const [existingMember] = await db.select().from(schema.orgMembers)
        .where(and(
          eq(schema.orgMembers.userId, userId),
          eq(schema.orgMembers.orgId, invite.orgId),
        ))
        .limit(1);

      if (!existingMember) {
        await db.insert(schema.orgMembers).values({
          orgId: invite.orgId,
          userId,
          role: invite.role,
          status: "active",
          invitedBy: invite.invitedBy,
        });
      }
    } else {
      const hashedPassword = await hashPassword(password);
      const [user] = await db.insert(schema.users).values({
        email: invite.email,
        name: name ?? invite.email.split("@")[0],
        passwordHash: hashedPassword,
      }).returning();
      userId = user.id;

      await db.insert(schema.orgMembers).values({
        orgId: invite.orgId,
        userId,
        role: invite.role,
        status: "active",
        invitedBy: invite.invitedBy,
      });
    }

    // Mark invitation as accepted
    await db.update(schema.organizationInvitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(schema.organizationInvitations.id, invite.id));

    // Create auth session
    const tokenFamily = crypto.randomUUID();
    const refreshToken = await createRefreshToken(userId, tokenFamily);
    await db.insert(schema.authSessions).values({
      orgId: invite.orgId,
      userId,
      tokenFamily,
      currentRefreshHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const token = await createAccessToken({
      sub: userId,
      email: invite.email,
      org_id: invite.orgId,
      role: invite.role as "student" | "instructor" | "admin",
    });

    await writeAudit({
      orgId: invite.orgId,
      actorUserId: userId,
      action: "invitation_accepted",
      entityType: "organization_invitation",
      entityId: invite.id,
    });

    const response = NextResponse.json({
      token,
      user: { email: invite.email, name: name ?? invite.email.split("@")[0], role: invite.role },
    }, { status: 201 });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/api/auth",
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err), error_code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
