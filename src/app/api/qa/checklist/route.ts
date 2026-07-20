import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { HLD_QA_CHECKLIST, LLD_QA_CHECKLIST, evaluateChecklist, type QADisposition } from "@/lib/qa-checklist";
import { z } from "zod";

const QASubmitSchema = z.object({
  stage: z.enum(["hld","lld"]),
  revisionId: z.string().uuid(),
  dispositions: z.array(z.object({ checklistItemId: z.string(), status: z.enum(["pass","fail","not_applicable","requires_review"]), evidence: z.string().optional(), reviewerId: z.string(), comments: z.string().optional(), timestamp: z.string() })),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const stage = request.nextUrl.searchParams.get("stage") ?? "hld";
  const checklist = stage === "lld" ? LLD_QA_CHECKLIST : HLD_QA_CHECKLIST;
  const mandatoryIds = checklist.filter((c) => c.isMandatory).map((c) => c.id);
  return NextResponse.json({ stage, items: checklist, mandatoryItems: mandatoryIds, totalItems: checklist.length });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (auth.role !== "instructor" && auth.role !== "admin") return NextResponse.json({ error: "Instructor or admin required" }, { status: 403 });

  const body = await request.json();
  const parsed = QASubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const checklist = parsed.data.stage === "lld" ? LLD_QA_CHECKLIST : HLD_QA_CHECKLIST;
  const mandatoryIds = checklist.filter((c) => c.isMandatory).map((c) => c.id);
  const { passes, failures } = evaluateChecklist(parsed.data.dispositions as QADisposition[], mandatoryIds);

  const defectCount = { critical: 0, major: 0, minor: 0, advisory: 0 };
  for (const d of parsed.data.dispositions) { if (d.status === "fail") defectCount.major++; if (d.status === "requires_review") defectCount.minor++; }

  const result = { revisionId: parsed.data.revisionId, reviewerId: auth.sub, overallStatus: passes ? "approved" : "returned" as const, dispositions: parsed.data.dispositions, defectCount, mandatoryPassed: passes, mandatoryFailures: failures, createdAt: new Date().toISOString() };
  return NextResponse.json(result);
}
