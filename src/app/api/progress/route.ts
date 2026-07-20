import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ progress: null });
    }

    const conditions = [eq(schema.candidateProgress.userId, auth.sub)];
    if (projectId) conditions.push(eq(schema.candidateProgress.projectId, projectId));

    const rows = await db.select()
      .from(schema.candidateProgress)
      .where(and(...conditions));

    return NextResponse.json({
      progress: rows.map((r) => ({
        projectId: r.projectId,
        status: r.status,
        attempts: r.attempts,
        bestScore: r.bestScore,
        timeSpentMinutes: r.timeSpentMinutes,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { projectId, status } = await request.json();
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    await db.insert(schema.candidateProgress).values({
      userId: auth.sub,
      projectId,
      orgId: auth.org_id,
      status: status ?? "in_progress",
      startedAt: new Date(),
    }).onConflictDoUpdate({
      target: [schema.candidateProgress.userId, schema.candidateProgress.projectId],
      set: { status: status ?? "in_progress" },
    });

    return NextResponse.json({ updated: true, projectId, status: status ?? "in_progress" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
