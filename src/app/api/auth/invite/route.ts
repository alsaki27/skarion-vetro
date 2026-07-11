// Create invite (Chunk 5 Rev 3) — admin/instructor invites a user to an org
// Returns an invite token that the invited user presents at signup.
import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { INVITE_TOKENS } from "@/lib/auth/invite-tokens";

export async function POST(request: NextRequest) {
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

    if (role !== "student" && role !== "instructor" && role !== "admin") {
      return NextResponse.json({ error: "role must be student, instructor, or admin" }, { status: 400 });
    }

    const inviteToken = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // org_id is derived from authenticated context, never from caller
    INVITE_TOKENS.set(inviteToken, { email, orgId: auth.org_id, role, expiresAt });

    return NextResponse.json({
      invite_token: inviteToken,
      expires_at: new Date(expiresAt).toISOString(),
      message: `Invite created for ${email}. In production, an email would be sent. The token is: ${inviteToken}`,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
