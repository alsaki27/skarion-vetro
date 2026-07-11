import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { getAuthFromRequest } from "@/lib/auth";
import { authorize } from "@/lib/authorize";
import { writeAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "design.review_assigned");

    const db = getDb();
    if (!db) return NextResponse.json({ reviews: [] });

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    const conditions = [eq(schema.gradingResults.orgId, auth.org_id)];
    if (projectId) conditions.push(eq(schema.gradingResults.projectId, projectId));

    const rows = await db
      .select({
        id: schema.gradingResults.id,
        projectId: schema.gradingResults.projectId,
        userId: schema.gradingResults.userId,
        totalScore: schema.gradingResults.totalScore,
        isPassing: schema.gradingResults.isPassing,
        phase: schema.gradingResults.phase,
        createdAt: schema.gradingResults.createdAt,
        userEmail: schema.users.email,
        userName: schema.users.name,
      })
      .from(schema.gradingResults)
      .innerJoin(schema.users, eq(schema.gradingResults.userId, schema.users.id))
      .where(and(...conditions))
      .orderBy(schema.gradingResults.createdAt);

    return NextResponse.json({ reviews: rows });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
