import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { projectId, name, elements } = await request.json();
    if (!projectId || !name || !elements) {
      return NextResponse.json({ error: "projectId, name, and elements required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    const [checkpoint] = await db.insert(schema.designSnapshots).values({
      orgId: auth.org_id,
      projectId,
      userId: auth.sub,
      snapshotData: { elements, checkpointName: name, createdAt: new Date().toISOString() },
      snapshotNote: `checkpoint: ${name}`,
    }).returning();

    return NextResponse.json({ checkpointId: checkpoint.id, name, createdAt: checkpoint.createdAt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    const snapshots = await db.select({
      id: schema.designSnapshots.id,
      snapshotNote: schema.designSnapshots.snapshotNote,
      createdAt: schema.designSnapshots.createdAt,
    })
      .from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.projectId, projectId),
        eq(schema.designSnapshots.userId, auth.sub),
        eq(schema.designSnapshots.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.designSnapshots.createdAt))
      .limit(50);

    return NextResponse.json({ checkpoints: snapshots });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
