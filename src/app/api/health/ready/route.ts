import { NextResponse } from "next/server";
import { getDb } from "@/db";

export async function GET() {
  const checks: Record<string, string> = {};

  // Database check
  try {
    const db = getDb();
    if (db) {
      await db.execute?.("SELECT 1");
      checks.database = "ok";
    } else {
      checks.database = "skipped (no DATABASE_URL)";
    }
  } catch {
    checks.database = "unreachable";
  }

  const allOk = Object.values(checks).every((s) => s === "ok" || s.startsWith("skipped"));

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
