import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    if (!db) return NextResponse.json({ progress: [] });

    const rows = await db
      .select()
      .from(schema.candidateProgress)
      .where(
        and(
          eq(schema.candidateProgress.userId, auth.sub),
          eq(schema.candidateProgress.orgId, auth.org_id),
        ),
      );

    return NextResponse.json({ progress: rows });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 500 });

    const body = await request.json();
    const { projectId } = body;
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    // Upsert: create progress record if not exists
    const [progress] = await db
      .insert(schema.candidateProgress)
      .values({
        userId: auth.sub,
        projectId,
        orgId: auth.org_id,
        status: "in_progress",
        startedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.candidateProgress.userId, schema.candidateProgress.projectId],
        set: { status: "in_progress" },
      })
      .returning();

    return NextResponse.json({ progress }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
