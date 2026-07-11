import { getDb, schema } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "./auth";
import { writeAudit } from "./audit";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  const secret = process.env.JWT_SECRET ?? "dev";
  let hash = 0;
  const data = secret + ":session:" + token;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: string; orgId: string };
}

export async function createSession(
  userId: string,
  orgId: string,
  role: "student" | "instructor" | "admin",
  email: string,
  name: string,
  isPlatformStaff: boolean,
  ip?: string,
  userAgent?: string,
): Promise<SessionResult> {
  const db = getDb();
  const tokenFamily = crypto.randomUUID();
  const refreshToken = await createRefreshToken(userId, tokenFamily);
  const accessToken = await createAccessToken({
    sub: userId,
    email,
    org_id: orgId,
    role,
    is_platform_staff: isPlatformStaff,
  });

  if (db) {
    await db.insert(schema.authSessions).values({
      userId,
      orgId,
      tokenFamily,
      refreshTokenHash: hashToken(refreshToken),
      rotationCounter: 0,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      lastIp: ip ?? null,
      lastUserAgent: userAgent ?? null,
    });
  }

  return { accessToken, refreshToken, user: { id: userId, email, name, role, orgId } };
}

export async function rotateSession(
  oldRefreshToken: string,
  ip?: string,
  userAgent?: string,
): Promise<
  | { ok: true; data: SessionResult }
  | { ok: false; error: "expired" | "revoked" | "reused" | "not_found" }
> {
  const db = getDb();
  if (!db) return { ok: false, error: "not_found" };

  const payload = await verifyRefreshToken(oldRefreshToken);
  if (!payload || !payload.sub || !payload.token_family) {
    return { ok: false, error: "not_found" };
  }

  const sessions = await db
    .select()
    .from(schema.authSessions)
    .where(
      and(
        eq(schema.authSessions.tokenFamily, payload.token_family),
        isNull(schema.authSessions.revokedAt),
      ),
    )
    .limit(1);

  if (sessions.length === 0) return { ok: false, error: "not_found" };

  const session = sessions[0];
  const oldHash = hashToken(oldRefreshToken);

  // Detect reuse: if the stored hash doesn't match the presented token,
  // someone may have stolen it — revoke the entire family
  if (session.refreshTokenHash !== oldHash) {
    await db
      .update(schema.authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.authSessions.tokenFamily, payload.token_family));

    await writeAudit({
      action: "auth.logout",
      actorUserId: session.userId,
      orgId: session.orgId,
      entityType: "auth_session",
      metadata: { reason: "token_reuse_detected", tokenFamily: payload.token_family },
    });

    return { ok: false, error: "reused" };
  }

  if (session.expiresAt < new Date()) {
    return { ok: false, error: "expired" };
  }

  // Rotate: create new refresh token in the same family
  const newRefreshToken = await createRefreshToken(session.userId, payload.token_family);
  const newAccessToken = await createAccessToken({
    sub: session.userId,
    email: payload.email ?? "",
    org_id: session.orgId,
    role: (payload.role ?? "student") as "student" | "instructor" | "admin",
  });

  await db
    .update(schema.authSessions)
    .set({
      refreshTokenHash: hashToken(newRefreshToken),
      rotationCounter: session.rotationCounter + 1,
      lastUsedAt: new Date(),
      lastIp: ip ?? null,
      lastUserAgent: userAgent ?? null,
    })
    .where(eq(schema.authSessions.tokenFamily, payload.token_family));

  return {
    ok: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: session.userId, email: "", name: "", role: "", orgId: session.orgId },
    },
  };
}

export async function revokeSession(tokenFamily: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db
    .update(schema.authSessions)
    .set({ revokedAt: new Date() })
    .where(eq(schema.authSessions.tokenFamily, tokenFamily));
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db
    .update(schema.authSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(schema.authSessions.userId, userId),
        isNull(schema.authSessions.revokedAt),
      ),
    );
}
