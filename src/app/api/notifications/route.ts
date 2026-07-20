import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    // Notifications are in-memory for now; DB-backed in production via chunk 087
    // For local development, return empty with schema indicator
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      total: 0,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
