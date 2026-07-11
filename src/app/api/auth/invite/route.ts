import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import crypto from "crypto";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`invite:${ip}`, "invite");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests", error_code: "RATE_LIMITED" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required", error_code: "UNAUTHORIZED" }, { status: 401 });
    }

    if (auth.role !== "admin" && auth.role !== "instructor") {
      return NextResponse.json({ error: "Insufficient permissions", error_code: "FORBIDDEN" }, { status: 403 });
    }

    const { email, role } = await request.json();
    if (!email || !role) {
      return NextResponse.json({ error: "email and role required", error_code: "VALIDATION_ERROR" }, { status: 400 });
    }

    if (!["student", "instructor", "admin"].includes(role)) {
      return NextResponse.json({ error: "role must be student, instructor, or admin", error_code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const db = getDb();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (!db) {
      return NextResponse.json({ error: "Invitations require a database connection", error_code: "SERVICE_UNAVAILABLE" }, { status: 503 });
    }

    // Check if user already has a pending invitation
    const [existing] = await db.select().from(schema.organizationInvitations)
      .where(
      and(
        eq(schema.organizationInvitations.email, email),
        eq(schema.organizationInvitations.status, "pending"),
      ),
      )
      .limit(1);

    if (existing) {
      await db.update(schema.organizationInvitations)
        .set({ status: "revoked" })
        .where(eq(schema.organizationInvitations.id, existing.id));
    }

    await db.insert(schema.organizationInvitations).values({
      orgId: auth.org_id,
      email,
      role: role as "student" | "instructor" | "admin",
      invitedBy: auth.sub,
      tokenHash: hashToken(token),
      expiresAt,
    });

    await writeAudit({
      orgId: auth.org_id,
      actorUserId: auth.sub,
      action: "invite_created",
      entityType: "organization_invitation",
      metadata: { email, role },
    });

    return NextResponse.json({
      invite_token: token,
      expires_at: expiresAt.toISOString(),
      message: `Invite created for ${email}. In production, an email would be sent.`,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err), error_code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
