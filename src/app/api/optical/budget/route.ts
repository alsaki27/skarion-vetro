import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { calculateOpticalBudget, findWorstPath } from "@/lib/optical-budget";
import { OpticalSchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = OpticalSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid optical paths", details: parsed.error.flatten() }, { status: 400 });

    const { paths, wavelength } = parsed.data;
    const typedPaths = paths.map((p) => ({ ...p, label: p.label ?? "", segments: p.segments.map((s) => ({ ...s, label: s.label ?? "" })) }));
    const budgets = typedPaths.map((p) => calculateOpticalBudget(p, wavelength ?? 1550));
    const worst = findWorstPath(typedPaths, wavelength ?? 1550);

    return NextResponse.json({ budgets, worstPath: worst ? { pathId: worst.pathId, totalLossDb: worst.totalLossDb, passes: worst.passes } : null, summary: { totalPaths: budgets.length, passing: budgets.filter((b) => b.passes).length, failing: budgets.filter((b) => !b.passes).length } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
