import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { HLD_QA_CHECKLIST, LLD_QA_CHECKLIST, evaluateChecklist, type QADisposition } from "@/lib/qa-checklist";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const stage = request.nextUrl.searchParams.get("stage") ?? "hld";

  try {
    const checklist = stage === "lld" ? LLD_QA_CHECKLIST : HLD_QA_CHECKLIST;
    const mandatoryIds = checklist.filter((c) => c.isMandatory).map((c) => c.id);

    return NextResponse.json({
      stage,
      items: checklist,
      mandatoryItems: mandatoryIds,
      totalItems: checklist.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { stage, revisionId, dispositions } = await request.json();
    if (!stage || !revisionId || !dispositions) {
      return NextResponse.json({ error: "stage, revisionId, and dispositions required" }, { status: 400 });
    }

    const checklist = stage === "lld" ? LLD_QA_CHECKLIST : HLD_QA_CHECKLIST;
    const mandatoryIds = checklist.filter((c) => c.isMandatory).map((c) => c.id);
    const { passes, failures } = evaluateChecklist(dispositions as QADisposition[], mandatoryIds);

    const defectCount = { critical: 0, major: 0, minor: 0, advisory: 0 };
    for (const d of dispositions as QADisposition[]) {
      if (d.status === "fail") defectCount.major++;
      if (d.status === "requires_review") defectCount.minor++;
    }

    return NextResponse.json({
      revisionId,
      reviewerId: auth.sub,
      overallStatus: passes ? "approved" : "returned",
      dispositions,
      defectCount,
      mandatoryPassed: passes,
      mandatoryFailures: failures,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
