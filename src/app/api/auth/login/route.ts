import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { verifyPassword, createAccessToken, createRefreshToken } from "@/lib/auth";
import { isDevMode } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import crypto from "crypto";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`login:${ip}`, "login");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests", error_code: "RATE_LIMITED" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required", error_code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const db = getDb();

    if (!db || isDevMode()) {
      if (email === "dev@skarion.com" && password === "dev") {
        const tokenFamily = crypto.randomUUID();
        const accessToken = await createAccessToken({
          sub: "00000000-0000-0000-0000-000000000001",
          email: "dev@skarion.com",
          org_id: "00000000-0000-0000-0000-000000000001",
          role: "admin",
        });
        const refreshToken = await createRefreshToken("00000000-0000-0000-0000-000000000001", tokenFamily);

        const response = NextResponse.json({
          token: accessToken,
          user: { email: "dev@skarion.com", name: "Dev User", role: "admin" },
        });
        response.cookies.set("refresh_token", refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
          path: "/api/auth",
        });
        return response;
      }
      return NextResponse.json({ error: "Invalid email or password", error_code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password", error_code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password", error_code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const [member] = await db.select().from(schema.orgMembers).where(
      and(
        eq(schema.orgMembers.userId, user.id),
        eq(schema.orgMembers.status, "active"),
      ),
    ).limit(1);

    if (!member) {
      return NextResponse.json({ error: "No active organization membership found", error_code: "FORBIDDEN" }, { status: 403 });
    }

    // Create auth session with rotating refresh token family
    const tokenFamily = crypto.randomUUID();
    const refreshToken = await createRefreshToken(user.id, tokenFamily);
    const refreshHash = hashToken(refreshToken);

    await db.insert(schema.authSessions).values({
      orgId: member.orgId,
      userId: user.id,
      tokenFamily,
      currentRefreshHash: refreshHash,
      deviceInfo: request.headers.get("user-agent") ?? undefined,
      ipAddress: ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));

    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      org_id: member.orgId,
      role: member.role,
      is_platform_staff: user.isPlatformStaff ?? false,
    });

    await writeAudit({
      orgId: member.orgId,
      actorUserId: user.id,
      action: "login",
      entityType: "user",
      entityId: user.id,
    });

    const response = NextResponse.json({
      token: accessToken,
      user: { email: user.email, name: user.name, role: member.role, org_id: member.orgId },
    });
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
