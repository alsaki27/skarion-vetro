// Logout — revokes the current session and clears refresh token cookie.
import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest, verifyRefreshToken } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    const refreshToken = request.cookies.get("refresh_token")?.value;

    const db = getDb();
    if (db && refreshToken) {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload && payload.token_family) {
        await db.update(schema.authSessions)
          .set({ revokedAt: new Date() })
          .where(eq(schema.authSessions.tokenFamily, payload.token_family));

        if (auth) {
          await writeAudit({
            orgId: auth.org_id,
            actorUserId: auth.sub,
            action: "logout",
            entityType: "auth_session",
            metadata: { tokenFamily: payload.token_family },
          });
        }
      }
    }

    const response = NextResponse.json({ message: "Logged out" });
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/api/auth",
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err), error_code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
