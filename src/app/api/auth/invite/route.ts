// Create invite (Chunk 5 Rev 3) — admin/instructor invites a user to an org
// Returns an invite token that the invited user presents at signup.
import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

const INVITE_TOKENS = new Map<string, { email: string; orgId: string; role: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);

    // Dev mode: any authenticated user can create invites
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (auth.role !== "admin" && auth.role !== "instructor") {
      return NextResponse.json({ error: "Only admin and instructor roles can create invites" }, { status: 403 });
    }

    const { email, role, orgId } = await request.json();
    if (!email || !role || !orgId) {
      return NextResponse.json({ error: "email, role, and orgId required" }, { status: 400 });
    }

    if (role !== "student" && role !== "instructor" && role !== "admin") {
      return NextResponse.json({ error: "role must be student, instructor, or admin" }, { status: 400 });
    }

    const inviteToken = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    INVITE_TOKENS.set(inviteToken, { email, orgId, role, expiresAt });

    return NextResponse.json({
      invite_token: inviteToken,
      expires_at: new Date(expiresAt).toISOString(),
      message: `Invite created for ${email}. In production, an email would be sent. The token is: ${inviteToken}`,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
