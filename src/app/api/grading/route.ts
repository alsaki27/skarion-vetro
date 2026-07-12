import { NextRequest, NextResponse } from "next/server";
import type { BasemapDataset, NetworkElement } from "@/lib/types";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { PROJECTS } from "@/lib/projects";
import { runGrading } from "@/lib/grading/engine";
import { loadParcels, loadAddresses } from "@/lib/basemap-loader";

const GATE_CHECK_IDS = new Set([
  "connectivity",
  "compliance",
  "capacity",
  "trespass",
  "unassigned_premise",
]);

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    const body = await request.json() as Record<string, unknown>;
    const projectId = body.projectId as string | undefined;
    const elements = body.elements as NetworkElement[] | undefined;
    if (!projectId || !elements) {
      return NextResponse.json({ error: "projectId and elements required" }, { status: 400 });
    }

    const project = PROJECTS[projectId];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Load basemap data server-side when the project references a real basemap.
    // This ensures geometry-aware checks (trespass, boundary) have the parcel
    // polygons they need — the client never sends raw county geometry.
    let basemapData: BasemapDataset | undefined;
    if (project.basemapId) {
      try {
        const parcels = loadParcels(project.basemapId).valid;
        const addresses = loadAddresses(project.basemapId).valid;
        basemapData = { parcels, addresses };
      } catch {
        // Basemap unavailable — trespass/boundary checks will report
        // not_evaluated rather than silently passing.
      }
    }

    const result = runGrading(project, elements, basemapData);

    // Split checks into GATES (mandatory pass/fail) and weighted quality checks.
    // This is the server-authoritative enforcement: the client's score is
    // ignored entirely — the server re-runs the full check registry.
    const gateChecks = result.checks.filter((c) => GATE_CHECK_IDS.has(c.checkId));
    const qualityChecks = result.checks.filter((c) => !GATE_CHECK_IDS.has(c.checkId));
    const gatesPassed = gateChecks.every((c) => c.status === "pass");
    const gateFailures = gateChecks.filter((c) => c.status === "fail");

    // Server-computed pass/fail: if any gate fails, the submission fails
    // regardless of the weighted quality score.
    const serverIsPassing = result.isPassing && gatesPassed;

    // Persist if DB available
    let persistedId: string | undefined;
    if (db && auth) {
      const grading = await db.insert(schema.gradingResults).values({
        projectId,
        userId: auth.sub,
        totalScore: result.totalScore,
        isPassing: serverIsPassing,
        phase: "hld",
        categoryScores: result.categories,
        feedback: result.checks,
      }).returning();
      persistedId = grading[0].id;
    }

    return NextResponse.json({
      // Original grading data
      totalScore: result.totalScore,
      categories: result.categories,
      checks: result.checks,
      // Gate-separated response
      gates: {
        passed: gatesPassed,
        failures: gateFailures.map((c) => ({ checkId: c.checkId, message: c.message, elementIds: c.elementIds })),
      },
      isPassing: serverIsPassing,
      passThreshold: result.passThreshold,
      gradedAt: result.gradedAt,
      persistedId,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
