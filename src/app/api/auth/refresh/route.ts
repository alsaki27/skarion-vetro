import { NextRequest, NextResponse } from "next/server";
import { rotateSession } from "@/lib/sessions";

export async function POST(request: NextRequest) {
  try {
    const refreshToken =
      request.cookies.get("refresh_token")?.value ??
      (await request.json().then((b) => b.refresh_token).catch(() => null));

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token required" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const result = await rotateSession(refreshToken, ip, userAgent);

    if (!result.ok) {
      if (result.error === "reused") {
        return NextResponse.json({ error: "Session revoked — please log in again" }, { status: 401 });
      }
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const { data } = result;

    const response = NextResponse.json({
      token: data.accessToken,
      user: data.user,
    });

    response.cookies.set("refresh_token", data.refreshToken, {
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
