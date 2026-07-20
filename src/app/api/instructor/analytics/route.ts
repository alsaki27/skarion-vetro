import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (auth.role !== "instructor" && auth.role !== "admin") {
    return NextResponse.json({ error: "Instructor or admin required" }, { status: 403 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    // Student progress by project
    const progressConditions = [eq(schema.candidateProgress.orgId, auth.org_id)];
    if (projectId) progressConditions.push(eq(schema.candidateProgress.projectId, projectId));

    const progress = await db.select({
      userId: schema.candidateProgress.userId,
      projectId: schema.candidateProgress.projectId,
      status: schema.candidateProgress.status,
      attempts: schema.candidateProgress.attempts,
      bestScore: schema.candidateProgress.bestScore,
      timeSpentMinutes: schema.candidateProgress.timeSpentMinutes,
    })
      .from(schema.candidateProgress)
      .where(and(...progressConditions))
      .orderBy(desc(schema.candidateProgress.bestScore));

    // Summary stats
    const totalStudents = new Set(progress.map((p) => p.userId)).size;
    const passedCount = progress.filter((p) => p.status === "passed").length;
    const avgBestScore = progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + (p.bestScore ?? 0), 0) / progress.length)
      : 0;

    // Recent submissions
    const recentAttempts = await db.select({
      id: schema.designAttempts.id,
      userId: schema.designAttempts.userId,
      projectId: schema.designAttempts.projectId,
      attemptNumber: schema.designAttempts.attemptNumber,
      createdAt: schema.designAttempts.createdAt,
    })
      .from(schema.designAttempts)
      .where(eq(schema.designAttempts.orgId, auth.org_id))
      .orderBy(desc(schema.designAttempts.createdAt))
      .limit(20);

    return NextResponse.json({
      summary: {
        totalStudents,
        totalSubmissions: progress.length,
        passedCount,
        avgBestScore,
      },
      progress,
      recentAttempts,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
