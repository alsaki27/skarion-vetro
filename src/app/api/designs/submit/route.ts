import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { runGrading } from "@/lib/grading/engine";
import { PROJECTS } from "@/lib/projects";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { projectId, designId, elements } = await request.json();
    if (!projectId || !elements) {
      return NextResponse.json({ error: "projectId and elements required" }, { status: 400 });
    }

    const project = PROJECTS[projectId];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database required for submission" }, { status: 503 });
    }

    // Create immutable design snapshot
    const [snapshot] = await db.insert(schema.designSnapshots).values({
      orgId: auth.org_id,
      projectId,
      userId: auth.sub,
      snapshotData: { elements, submittedAt: new Date().toISOString(), designId },
      snapshotNote: `submission-${Date.now()}`,
    }).returning();

    // Run grading server-side
    const result = runGrading(project, elements as never);

    // Save grading result
    const [gradingResult] = await db.insert(schema.gradingResults).values({
      orgId: auth.org_id,
      projectId,
      userId: auth.sub,
      totalScore: result.totalScore,
      isPassing: result.isPassing,
      categoryScores: result.categories.reduce((acc, c) => ({ ...acc, [c.name]: { score: c.score, status: c.status } }), {}),
      feedback: { checks: result.checks },
    }).returning();

    // Record attempt
    const [prevAttempt] = await db.select({ max: schema.designAttempts.attemptNumber })
      .from(schema.designAttempts)
      .where(and(
        eq(schema.designAttempts.userId, auth.sub),
        eq(schema.designAttempts.projectId, projectId),
      ))
      .orderBy(desc(schema.designAttempts.attemptNumber))
      .limit(1);

    const attemptNumber = (prevAttempt?.max ?? 0) + 1;

    await db.insert(schema.designAttempts).values({
      orgId: auth.org_id,
      userId: auth.sub,
      projectId,
      snapshotId: snapshot.id,
      gradingResultId: gradingResult.id,
      attemptNumber,
    });

    // Update progress
    await db.insert(schema.candidateProgress).values({
      userId: auth.sub,
      projectId,
      orgId: auth.org_id,
      status: result.isPassing ? "passed" : "submitted",
      attempts: attemptNumber,
      bestScore: result.totalScore,
      startedAt: new Date(),
      completedAt: result.isPassing ? new Date() : undefined,
    }).onConflictDoUpdate({
      target: [schema.candidateProgress.userId, schema.candidateProgress.projectId],
      set: {
        status: result.isPassing ? "passed" : "submitted",
        attempts: attemptNumber,
        bestScore: result.totalScore,
        completedAt: result.isPassing ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      submissionId: snapshot.id,
      attemptNumber,
      grading: {
        totalScore: result.totalScore,
        isPassing: result.isPassing,
        passThreshold: result.passThreshold,
        categories: result.categories,
        checks: result.checks,
        gradedAt: new Date().toISOString(),
      },
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

    const attempts = await db.select()
      .from(schema.designAttempts)
      .where(and(
        eq(schema.designAttempts.userId, auth.sub),
        eq(schema.designAttempts.projectId, projectId),
        eq(schema.designAttempts.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.designAttempts.createdAt));

    const progress = await db.select()
      .from(schema.candidateProgress)
      .where(and(
        eq(schema.candidateProgress.userId, auth.sub),
        eq(schema.candidateProgress.projectId, projectId),
      ))
      .limit(1);

    return NextResponse.json({
      attempts: attempts.map((a) => ({
        id: a.id,
        attemptNumber: a.attemptNumber,
        gradingResultId: a.gradingResultId,
        createdAt: a.createdAt,
      })),
      progress: progress[0] ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
