import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { runGrading } from "@/lib/grading/engine";
import { PROJECTS } from "@/lib/projects";
import { SubmissionSchema } from "@/lib/api-schemas";
import { resolveProjectId } from "@/lib/project-resolver";
import { loadAddresses, loadParcels } from "@/lib/basemap-loader";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = SubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const slug = parsed.data.projectId;
    const projectId = await resolveProjectId(slug, auth.org_id);
    if (!projectId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = PROJECTS[slug];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { elements, designId } = parsed.data;

    // Load basemap data for authoritative grading (matching /api/grading behavior)
    let basemapData: unknown;
    try {
      const [parcelsResult, addressesResult] = await Promise.all([loadParcels(slug), loadAddresses(slug)]);
      basemapData = { parcels: parcelsResult, addresses: addressesResult };
    } catch { /* continue without basemap */ }

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

    // Run grading server-side with basemap data
    const result = runGrading(project, elements as never, basemapData as never);

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

    // Query existing progress to preserve best score
    const progress = await db.select({ bestScore: schema.candidateProgress.bestScore, completedAt: schema.candidateProgress.completedAt })
      .from(schema.candidateProgress)
      .where(and(eq(schema.candidateProgress.userId, auth.sub), eq(schema.candidateProgress.projectId, projectId)))
      .limit(1);

    // Update progress — preserve best score
    const existingBestScore = progress[0]?.bestScore ?? 0;
    const newBestScore = Math.max(existingBestScore, result.totalScore);

    await db.insert(schema.candidateProgress).values({
      userId: auth.sub,
      projectId,
      orgId: auth.org_id,
      status: (result.isPassing || existingBestScore >= (project.passThreshold ?? 85)) ? "passed" : "submitted",
      attempts: attemptNumber,
      bestScore: newBestScore,
      startedAt: new Date(),
      completedAt: result.isPassing ? new Date() : (existingBestScore >= (project.passThreshold ?? 85) ? progress[0]?.completedAt : undefined),
    }).onConflictDoUpdate({
      target: [schema.candidateProgress.userId, schema.candidateProgress.projectId],
      set: {
        status: sql`CASE WHEN ${result.isPassing} OR ${schema.candidateProgress.bestScore} >= ${project.passThreshold ?? 85} THEN 'passed' ELSE 'submitted' END`,
        attempts: attemptNumber,
        bestScore: sql`GREATEST(${schema.candidateProgress.bestScore}, ${result.totalScore})`,
        completedAt: sql`CASE WHEN ${result.isPassing} THEN NOW() ELSE ${schema.candidateProgress.completedAt} END`,
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
