// Token refresh with rotation and reuse detection.
import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { verifyRefreshToken, createAccessToken, createRefreshToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import { eq, and, isNull } from "drizzle-orm";
import crypto from "crypto";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`refresh:${ip}`, "refresh");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests", error_code: "RATE_LIMITED" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token required", error_code: "UNAUTHORIZED" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload || !payload.sub || !payload.token_family) {
      return NextResponse.json({ error: "Invalid refresh token", error_code: "UNAUTHORIZED" }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Auth persistence requires a database", error_code: "SERVICE_UNAVAILABLE" }, { status: 503 });
    }

    // Find the session by token family
    const [session] = await db.select()
      .from(schema.authSessions)
      .where(and(
        eq(schema.authSessions.tokenFamily, payload.token_family),
        eq(schema.authSessions.userId, payload.sub),
        isNull(schema.authSessions.revokedAt),
      ))
      .limit(1);

    if (!session) {
      // Token family not found or revoked — possible reuse attack
      await writeAudit({
        action: "refresh_token_reuse_detected",
        entityType: "user",
        entityId: payload.sub,
        metadata: { tokenFamily: payload.token_family },
      });
      return NextResponse.json({ error: "Session not found", error_code: "UNAUTHORIZED" }, { status: 401 });
    }

    // Check if the refresh token hash matches
    const incomingHash = hashToken(refreshToken);
    if (session.currentRefreshHash !== incomingHash) {
      // Reuse detected — revoke entire token family
      await db.update(schema.authSessions)
        .set({ revokedAt: new Date() })
        .where(eq(schema.authSessions.tokenFamily, payload.token_family));

      await writeAudit({
        orgId: session.orgId,
        actorUserId: session.userId,
        action: "refresh_token_reuse_revoked",
        entityType: "auth_session",
        entityId: session.id,
        metadata: { tokenFamily: payload.token_family },
      });

      return NextResponse.json({ error: "Token reuse detected — session revoked", error_code: "TOKEN_REUSE" }, { status: 401 });
    }

    // Rotate: issue new tokens and update session
    const newTokenFamily = crypto.randomUUID();
    const newAccessToken = await createAccessToken({
      sub: session.userId,
      email: payload.email ?? "",
      org_id: session.orgId,
      role: "student",
    });
    const newRefreshToken = await createRefreshToken(session.userId, newTokenFamily);
    const newHash = hashToken(newRefreshToken);

    await db.update(schema.authSessions)
      .set({
        tokenFamily: newTokenFamily,
        currentRefreshHash: newHash,
        lastUsedAt: new Date(),
      })
      .where(eq(schema.authSessions.id, session.id));

    await writeAudit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "token_refreshed",
      entityType: "auth_session",
      entityId: session.id,
    });

    const response = NextResponse.json({ token: newAccessToken });
    response.cookies.set("refresh_token", newRefreshToken, {
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
