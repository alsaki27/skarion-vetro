import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { projectId, clientEtag } = await request.json();
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    const [latest] = await db.select({
      id: schema.designSnapshots.id,
      createdAt: schema.designSnapshots.createdAt,
      snapshotData: schema.designSnapshots.snapshotData,
    })
      .from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.projectId, projectId),
        eq(schema.designSnapshots.userId, auth.sub),
        eq(schema.designSnapshots.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.designSnapshots.createdAt))
      .limit(1);

    if (!latest) return NextResponse.json({ conflict: false, message: "No existing design to conflict with" });

    const serverEtag = `${latest.id}:${new Date(latest.createdAt!).getTime()}`;

    if (clientEtag && clientEtag !== serverEtag) {
      return NextResponse.json({
        conflict: true,
        clientEtag,
        serverEtag,
        serverUpdatedAt: latest.createdAt,
        message: "Your design is stale. Someone else may have saved since you loaded.",
        resolution: "reload_or_fork",
      });
    }

    return NextResponse.json({ conflict: false, etag: serverEtag, lastSavedAt: latest.createdAt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
