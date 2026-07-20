import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getStagesForProject } from "@/lib/hld-curriculum";

const ALLOWED_TOOLS_BY_STAGE: Record<string, string[]> = {
  orientation: ["select", "pan", "zoom"],
  data_review: ["select", "pan", "zoom"],
  service_groups: ["select", "pan", "zoom"],
  structures: ["select", "pan", "zoom", "pole", "handhole", "vault", "flowerpot", "co", "fdh_cabinet", "premise"],
  routes: ["select", "pan", "zoom", "cable", "conduit", "drop_cable", "pole", "handhole", "vault"],
  topology: ["select", "pan", "zoom", "mst", "splitter", "splice_closure", "slack_loop"],
  hld_review: ["select", "pan", "zoom"],
};

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  try {
    const stages = getStagesForProject(projectId, 1);
    const currentStageIdx = stages.findIndex((s) =>
      s.status === "available" || s.status === "in_progress"
    );
    const currentStage = currentStageIdx >= 0 ? stages[currentStageIdx] : stages[0];

    return NextResponse.json({
      stages: stages.map((s) => ({
        stage: s.stage,
        status: s.status,
        dependsOn: s.dependsOn,
        allowedTools: s.status === "locked" ? [] : (ALLOWED_TOOLS_BY_STAGE[s.stage] ?? []),
        gates: s.gates,
      })),
      currentStage: currentStage?.stage ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { projectId, requestedTool } = await request.json();
    if (!projectId || !requestedTool) {
      return NextResponse.json({ error: "projectId and requestedTool required" }, { status: 400 });
    }

    const stages = getStagesForProject(projectId, 1);
    const currentStage = stages.find((s) =>
      s.status === "available" || s.status === "in_progress"
    ) ?? stages[0];

    if (!currentStage) return NextResponse.json({ error: "No stages available" }, { status: 400 });

    const allowedTools = ALLOWED_TOOLS_BY_STAGE[currentStage.stage] ?? [];
    const isAllowed = allowedTools.includes(requestedTool);

    if (!isAllowed) {
      return NextResponse.json({
        allowed: false,
        message: `Tool '${requestedTool}' locked in stage '${currentStage.stage}'. Available: ${allowedTools.join(", ")}`,
      }, { status: 403 });
    }

    return NextResponse.json({ allowed: true, stage: currentStage.stage, tool: requestedTool });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
