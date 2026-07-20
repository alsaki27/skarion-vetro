import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const snapshotId = request.nextUrl.searchParams.get("snapshotId");
  if (!snapshotId) return NextResponse.json({ error: "snapshotId required" }, { status: 400 });

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    const [snapshot] = await db.select()
      .from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.id, snapshotId),
        eq(schema.designSnapshots.orgId, auth.org_id),
      ))
      .limit(1);

    if (!snapshot) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });

    return NextResponse.json({
      id: snapshot.id,
      projectId: snapshot.projectId,
      data: snapshot.snapshotData,
      note: snapshot.snapshotNote,
      createdAt: snapshot.createdAt,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { snapshotId, projectId } = await request.json();
    if (!snapshotId || !projectId) {
      return NextResponse.json({ error: "snapshotId and projectId required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    // Load the snapshot
    const [snapshot] = await db.select()
      .from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.id, snapshotId),
        eq(schema.designSnapshots.orgId, auth.org_id),
      ))
      .limit(1);

    if (!snapshot) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });

    // Create a new working revision from the snapshot
    const [restored] = await db.insert(schema.designSnapshots).values({
      orgId: auth.org_id,
      projectId,
      userId: auth.sub,
      snapshotData: snapshot.snapshotData,
      snapshotNote: `restored from ${snapshotId}`,
    }).returning();

    return NextResponse.json({
      restored: true,
      newSnapshotId: restored.id,
      originalSnapshotId: snapshotId,
      data: restored.snapshotData,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
