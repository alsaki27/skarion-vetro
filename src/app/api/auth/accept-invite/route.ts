// Accept invite (Chunk 5 Rev 3) — invited user completes signup with password
// Creates user row + org_members row, returns JWT.
import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { hashPassword, createAccessToken, createRefreshToken } from "@/lib/auth";

const INVITE_TOKENS = new Map<string, { email: string; orgId: string; role: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { invite_token, password, name } = await request.json();
    if (!invite_token || !password) {
      return NextResponse.json({ error: "invite_token and password required" }, { status: 400 });
    }

    const invite = INVITE_TOKENS.get(invite_token);
    if (!invite) {
      return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 400 });
    }

    if (Date.now() > invite.expiresAt) {
      INVITE_TOKENS.delete(invite_token);
      return NextResponse.json({ error: "Invite token expired" }, { status: 400 });
    }

    const db = getDb();
    const hashedPassword = await hashPassword(password);

    if (!db) {
      // Dev mode: create without DB (transient state, won't survive restart)
      const userId = crypto.randomUUID();
      const token = await createAccessToken({
        sub: userId,
        email: invite.email,
        org_id: invite.orgId,
        role: invite.role as "student" | "instructor" | "admin",
      });
      INVITE_TOKENS.delete(invite_token);
      return NextResponse.json({
        token,
        user: { email: invite.email, name: name ?? invite.email.split("@")[0], role: invite.role },
      }, { status: 201 });
    }

    // Production: persist user + org_members
    const [user] = await db.insert(schema.users).values({
      email: invite.email,
      name: name ?? invite.email.split("@")[0],
      passwordHash: hashedPassword,
    }).returning();

    await db.insert(schema.orgMembers).values({
      orgId: invite.orgId,
      userId: user.id,
      role: invite.role as "student" | "instructor" | "admin",
      status: "active",
    });

    const token = await createAccessToken({
      sub: user.id,
      email: user.email,
      org_id: invite.orgId,
      role: invite.role as "student" | "instructor" | "admin",
    });

    const refreshToken = await createRefreshToken(user.id, crypto.randomUUID());
    INVITE_TOKENS.delete(invite_token);

    const response = NextResponse.json({
      token,
      user: { email: user.email, name: user.name, role: invite.role },
    }, { status: 201 });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/api/auth",
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
