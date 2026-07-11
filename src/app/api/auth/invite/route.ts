import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { authorize } from "@/lib/authorize";
import { createInvite } from "@/lib/invitations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "member.invite");

    const body = await request.json();
    const { email, role } = body;
    if (!email || !role) {
      return NextResponse.json({ error: "email and role required" }, { status: 400 });
    }

    if (role !== "student" && role !== "instructor" && role !== "admin") {
      return NextResponse.json({ error: "role must be student, instructor, or admin" }, { status: 400 });
    }

    // Rate limit: 10 invites per actor per hour
    const rlKey = `invite:actor:${auth.sub}`;
    const rl = checkRateLimit(rlKey, { maxRequests: 10, windowMs: 3600_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many invites. Try again later." }, { status: 429 });
    }

    const result = await createInvite({
      orgId: auth.org_id,
      email,
      role,
      inviterId: auth.sub,
      inviterRole: auth.role,
    });

    return NextResponse.json({
      invite_token: result.token,
      expires_at: result.expiresAt,
      message: `Invite created for ${email}.`,
    }, { status: 201 });
  } catch (err) {
    const status = err instanceof Error && "httpStatus" in err
      ? (err as unknown as { httpStatus: number }).httpStatus
      : 500;
    return NextResponse.json({ error: String(err) }, { status });
  }
}
