import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getHintsForCheck, getAvailableTiers, getHintCost } from "@/lib/hints-data";
import { runGrading } from "@/lib/grading/engine";
import { PROJECTS } from "@/lib/projects";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const checkId = request.nextUrl.searchParams.get("checkId");
  const tier = parseInt(request.nextUrl.searchParams.get("tier") ?? "1");

  if (!checkId) return NextResponse.json({ error: "checkId required" }, { status: 400 });

  const hint = getHintsForCheck({ checkId, category: "", status: "fail", score: 0, message: "" } as never, tier);
  if (!hint) return NextResponse.json({ error: "No hint available for this check" }, { status: 404 });

  return NextResponse.json({
    checkId,
    tier,
    hint,
    cost: getHintCost(tier),
    availableTiers: getAvailableTiers(checkId),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { projectId, elements, revealedHints } = await request.json();
    if (!projectId || !elements) {
      return NextResponse.json({ error: "projectId and elements required" }, { status: 400 });
    }

    const project = PROJECTS[projectId];
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const result = runGrading(project, elements as never);
    const pending = revealedHints ?? [];

    const availableHints = result.checks
      .filter((c) => c.status === "fail" && !pending.includes(c.checkId))
      .map((c) => ({
        checkId: c.checkId,
        category: c.category,
        tier1: getHintsForCheck(c, 1),
        cost: getHintCost(1),
      }))
      .filter((h) => h.tier1);

    return NextResponse.json({
      totalScore: result.totalScore,
      failedChecks: result.checks.filter((c) => c.status === "fail").length,
      availableHints,
      revealedHints: pending,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
