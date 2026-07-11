import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { revokeAllUserSessions } from "@/lib/sessions";
import { writeAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await revokeAllUserSessions(auth.sub);

    await writeAudit({
      action: "auth.logout",
      actorUserId: auth.sub,
      orgId: auth.org_id,
      entityType: "auth_session",
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/api/auth",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
