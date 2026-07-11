import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required", error_code: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ status: "dev_mode", message: "Database not connected." });
  }

  const { id } = await params;

  const conditions = [eq(schema.designSnapshots.id, id), eq(schema.designSnapshots.orgId, auth.org_id)];
  if (auth.role === "student") {
    conditions.push(eq(schema.designSnapshots.userId, auth.sub));
  }

  const snapshots = await db.select()
    .from(schema.designSnapshots)
    .where(and(...conditions))
    .limit(1);

  if (!snapshots.length) {
    return NextResponse.json({ error: "Not found", error_code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(snapshots[0]);
}
