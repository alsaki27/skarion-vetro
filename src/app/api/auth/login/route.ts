// Login endpoint (Chunk 5 Rev 3) — email + password → JWT access + refresh
// Supports dev mode (hardcoded test user) when DATABASE_URL is unset.
import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { verifyPassword, createAccessToken, createRefreshToken } from "@/lib/auth";
import { isDevMode } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }

    const db = getDb();

    // Dev mode: accept any login with a hardcoded test user
    if (!db || isDevMode()) {
      if (email === "dev@skarion.com" && password === "dev") {
        const token = await createAccessToken({
          sub: "00000000-0000-0000-0000-000000000001",
          email: "dev@skarion.com",
          org_id: "00000000-0000-0000-0000-000000000001",
          role: "admin",
        });
        return NextResponse.json({ token, user: { email: "dev@skarion.com", name: "Dev User", role: "admin" } });
      }
      return NextResponse.json({ error: "Dev mode: use dev@skarion.com / dev. Set DATABASE_URL and JWT_SECRET for production auth." }, { status: 401 });
    }

    // Production: authenticate against database
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Get org membership — use the first active membership
    const [member] = await db.select().from(schema.orgMembers).where(
      and(
        eq(schema.orgMembers.userId, user.id),
        eq(schema.orgMembers.status, "active"),
      ),
    ).limit(1);

    if (!member) {
      return NextResponse.json({ error: "No active organization membership found" }, { status: 403 });
    }

    const token = await createAccessToken({
      sub: user.id,
      email: user.email,
      org_id: member.orgId,
      role: member.role,
      is_platform_staff: user.isPlatformStaff ?? false,
    });

    const refreshToken = await createRefreshToken(user.id, crypto.randomUUID());

    const response = NextResponse.json({
      token,
      user: { email: user.email, name: user.name, role: member.role, org_id: member.orgId },
    });

    // Set refresh token as httpOnly cookie
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/api/auth",
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
