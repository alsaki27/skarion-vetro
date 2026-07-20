import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { calculateOpticalBudget, findWorstPath, type OpticalPath } from "@/lib/optical-budget";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { paths, wavelength } = await request.json();
    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json({ error: "paths array required" }, { status: 400 });
    }

    const budgets = (paths as OpticalPath[]).map((p) => calculateOpticalBudget(p, wavelength ?? 1550));
    const worst = findWorstPath(paths as OpticalPath[], wavelength ?? 1550);

    return NextResponse.json({
      budgets,
      worstPath: worst ? { pathId: worst.pathId, totalLossDb: worst.totalLossDb, passes: worst.passes } : null,
      summary: {
        totalPaths: budgets.length,
        passing: budgets.filter((b) => b.passes).length,
        failing: budgets.filter((b) => !b.passes).length,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
