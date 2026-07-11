import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  if (!db || !auth) {
    return NextResponse.json({ status: "dev_mode", message: "Database not connected. Load from client state." });
  }

  const snapshots = await db.select()
    .from(schema.designSnapshots)
    .where(and(
      eq(schema.designSnapshots.id, id),
      eq(schema.designSnapshots.userId, auth.sub),
    ))
    .limit(1);

  if (!snapshots.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(snapshots[0]);
}
