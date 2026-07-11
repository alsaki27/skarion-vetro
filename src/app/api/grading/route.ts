import { NextRequest, NextResponse } from "next/server";
import type { NetworkElement } from "@/lib/types";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { PROJECTS } from "@/lib/projects";
import { runGrading } from "@/lib/grading/engine";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    const { projectId, elements } = await request.json();
    if (!projectId || !elements) {
      return NextResponse.json({ error: "projectId and elements required" }, { status: 400 });
    }

    const project = PROJECTS[projectId as string];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const result = runGrading(project, elements as NetworkElement[]);

    // If DB is available, persist the result
    if (db && auth) {
      const grading = await db.insert(schema.gradingResults).values({
        projectId,
        userId: auth.sub,
        totalScore: result.totalScore,
        isPassing: result.isPassing,
        phase: "hld",
        categoryScores: result.categories,
        feedback: result.checks,
      }).returning();

      return NextResponse.json({ ...result, persistedId: grading[0].id });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
