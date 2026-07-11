import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/sessions";
import { writeAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

function isDevMode(): boolean {
  return !process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret-change-me-before-prod--min-32-bytes";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }

    const db = getDb();

    // Dev mode: hardcoded test user when no DB or dev JWT secret
    if (!db || isDevMode()) {
      if (email === "dev@skarion.com" && password === "dev") {
        const result = await createSession(
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000001",
          "admin",
          "dev@skarion.com",
          "Dev User",
          true,
          request.headers.get("x-forwarded-for") ?? undefined,
          request.headers.get("user-agent") ?? undefined,
        );
        const response = NextResponse.json({
          token: result.accessToken,
          user: result.user,
        });
        response.cookies.set("refresh_token", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
          path: "/api/auth",
        });
        return response;
      }
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Production: throttle by email + IP
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const throttleKey = `login:${email}:${ip}`;
    const throttle = checkRateLimit(throttleKey, { maxRequests: 5, windowMs: 300_000 });
    if (!throttle.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const [member] = await db.select().from(schema.orgMembers).where(
      and(
        eq(schema.orgMembers.userId, user.id),
        eq(schema.orgMembers.status, "active"),
      ),
    ).limit(1);

    if (!member) {
      return NextResponse.json({ error: "No active organization membership found" }, { status: 403 });
    }

    // Update last login
    await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));

    const result = await createSession(
      user.id,
      member.orgId,
      member.role,
      user.email,
      user.name,
      user.isPlatformStaff ?? false,
      ip,
      request.headers.get("user-agent") ?? undefined,
    );

    await writeAudit({
      action: "auth.login",
      actorUserId: user.id,
      orgId: member.orgId,
      entityType: "auth_session",
    });

    const response = NextResponse.json({
      token: result.accessToken,
      user: result.user,
    });
    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/api/auth",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
