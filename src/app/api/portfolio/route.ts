import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    // Get completed projects with best scores
    const progress = await db.select()
      .from(schema.candidateProgress)
      .where(and(
        eq(schema.candidateProgress.userId, auth.sub),
        eq(schema.candidateProgress.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.candidateProgress.bestScore));

    const completed = progress.filter((p) => p.status === "passed");

    // Get attempt history
    const attempts = await db.select()
      .from(schema.designAttempts)
      .where(and(
        eq(schema.designAttempts.userId, auth.sub),
        eq(schema.designAttempts.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.designAttempts.createdAt))
      .limit(50);

    const portfolio = {
      student: {
        userId: auth.sub,
        email: auth.email,
      },
      summary: {
        projectsCompleted: completed.length,
        totalAttempts: attempts.length,
        averageBestScore: completed.length > 0
          ? Math.round(completed.reduce((s, p) => s + (p.bestScore ?? 0), 0) / completed.length)
          : 0,
      },
      completedProjects: completed.map((p) => ({
        projectId: p.projectId,
        bestScore: p.bestScore,
        attempts: p.attempts,
        timeSpentMinutes: p.timeSpentMinutes,
        completedAt: p.completedAt,
      })),
      recentAttempts: attempts.map((a) => ({
        id: a.id,
        projectId: a.projectId,
        attemptNumber: a.attemptNumber,
        createdAt: a.createdAt,
      })),
    };

    return NextResponse.json(portfolio);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
