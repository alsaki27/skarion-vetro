import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  // Without DB: return guidance for production setup
  if (!db || !auth) {
    return NextResponse.json({
      status: "dev_mode",
      message: "Auto-save is available once the database is connected. Your design is preserved in the browser's local state.",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { projectId, snapshotData, note } = await request.json();
    const result = await db.insert(schema.designSnapshots).values({
      projectId,
      userId: auth.sub,
      snapshotData,
      snapshotNote: note,
    }).returning();

    return NextResponse.json({ id: result[0].id, createdAt: result[0].createdAt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
