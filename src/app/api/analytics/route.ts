import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { getAuthFromRequest } from "@/lib/auth";
import { authorize } from "@/lib/authorize";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "design.review_assigned");

    const db = getDb();
    if (!db) return NextResponse.json({ analytics: null });

    const url = new URL(request.url);
    const cohortId = url.searchParams.get("cohortId");

    // Aggregate progress stats
    const progressStats = await db
      .select({
        status: schema.candidateProgress.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.candidateProgress)
      .where(
        cohortId
          ? and(
              eq(schema.candidateProgress.orgId, auth.org_id),
              sql`EXISTS (SELECT 1 FROM cohort_members cm WHERE cm.user_id = ${schema.candidateProgress.userId} AND cm.cohort_id = ${cohortId})`,
            )
          : eq(schema.candidateProgress.orgId, auth.org_id),
      )
      .groupBy(schema.candidateProgress.status);

    // Aggregate grading stats
    const gradingStats = await db
      .select({
        avgScore: sql<number>`AVG(${schema.gradingResults.totalScore})`,
        maxScore: sql<number>`MAX(${schema.gradingResults.totalScore})`,
        minScore: sql<number>`MIN(${schema.gradingResults.totalScore})`,
        totalSubmissions: sql<number>`COUNT(*)`,
        passingCount: sql<number>`SUM(CASE WHEN ${schema.gradingResults.isPassing} THEN 1 ELSE 0 END)`,
      })
      .from(schema.gradingResults)
      .where(eq(schema.gradingResults.orgId, auth.org_id));

    return NextResponse.json({
      analytics: {
        progress: progressStats,
        grading: gradingStats[0] ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
