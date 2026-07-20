import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getHintsForCheck, getAvailableTiers, getHintCost } from "@/lib/hints-data";
import { z } from "zod";

const HintQuerySchema = z.object({
  checkId: z.string().min(1),
  tier: z.coerce.number().int().min(1).max(3).default(1),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = HintQuerySchema.safeParse(params);
  if (!query.success) return NextResponse.json({ error: "Invalid query", details: query.error.flatten() }, { status: 400 });

  const hint = getHintsForCheck({ checkId: query.data.checkId, category: "", status: "fail", score: 0, message: "" } as never, query.data.tier);
  if (!hint) return NextResponse.json({ error: "No hint available" }, { status: 404 });

  return NextResponse.json({ checkId: query.data.checkId, tier: query.data.tier, hint, cost: getHintCost(query.data.tier), availableTiers: getAvailableTiers(query.data.checkId) });
}
