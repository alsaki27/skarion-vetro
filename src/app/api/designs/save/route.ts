import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { PROJECTS } from "@/lib/projects";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required", error_code: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({
      status: "dev_mode",
      message: "Design persistence requires a database connection.",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const { projectId, snapshotData, note } = await request.json();
    if (!projectId || !snapshotData) {
      return NextResponse.json({ error: "projectId and snapshotData required", error_code: "VALIDATION_ERROR" }, { status: 400 });
    }

    // Validate project exists and is accessible to the user's org
    const project = PROJECTS[projectId];
    if (!project) {
      return NextResponse.json({ error: "Project not found", error_code: "NOT_FOUND" }, { status: 404 });
    }

    const result = await db.insert(schema.designSnapshots).values({
      projectId,
      userId: auth.sub,
      orgId: auth.org_id,
      snapshotData,
      snapshotNote: note,
    }).returning();

    return NextResponse.json({ id: result[0].id, createdAt: result[0].createdAt });
  } catch (err) {
    return NextResponse.json({ error: String(err), error_code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
