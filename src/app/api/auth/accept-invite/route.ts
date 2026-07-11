import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createAccessToken, createRefreshToken } from "@/lib/auth";
import { acceptInvite } from "@/lib/invitations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invite_token, password, name } = body;
    if (!invite_token || !password) {
      return NextResponse.json({ error: "invite_token and password required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Rate limit: 5 attempts per IP per 15 minutes
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rlKey = `accept-invite:ip:${ip}`;
    const rl = checkRateLimit(rlKey, { maxRequests: 5, windowMs: 900_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    let result;
    try {
      const hashedPassword = await hashPassword(password);
      result = await acceptInvite({ token: invite_token, name: name ?? "", hashedPassword });
    } catch {
      return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 400 });
    }

    const token = await createAccessToken({
      sub: result.userId,
      email: result.email,
      org_id: result.orgId,
      role: result.role,
    });

    const refreshToken = await createRefreshToken(result.userId, crypto.randomUUID());

    const response = NextResponse.json({
      token,
      user: { email: result.email, name: name ?? result.email.split("@")[0], role: result.role },
    }, { status: 201 });

    response.cookies.set("refresh_token", refreshToken, {
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
