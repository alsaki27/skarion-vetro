import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { projectId, elements, note } = await request.json();
    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database required for autosave" }, { status: 503 });
    }

    const [existing] = await db.select({ id: schema.designSnapshots.id, snapshotData: schema.designSnapshots.snapshotData })
      .from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.projectId, projectId),
        eq(schema.designSnapshots.userId, auth.sub),
        eq(schema.designSnapshots.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.designSnapshots.createdAt))
      .limit(1);

    const result = await db.insert(schema.designSnapshots).values({
      orgId: auth.org_id,
      projectId,
      userId: auth.sub,
      snapshotData: { elements, savedAt: new Date().toISOString() },
      snapshotNote: note ?? "autosave",
    }).returning();

    return NextResponse.json({
      saved: true,
      revision: result[0].id,
      previousRevision: existing?.id ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database required" }, { status: 503 });
    }

    const snapshots = await db.select()
      .from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.projectId, projectId),
        eq(schema.designSnapshots.userId, auth.sub),
        eq(schema.designSnapshots.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.designSnapshots.createdAt))
      .limit(20);

    const latest = snapshots.length > 0 ? snapshots[0] : null;
    return NextResponse.json({
      history: snapshots.map((s) => ({ id: s.id, note: s.snapshotNote, createdAt: s.createdAt })),
      latest: latest ? { id: latest.id, data: latest.snapshotData, createdAt: latest.createdAt } : null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
