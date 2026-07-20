import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { z } from "zod";

const RedlineSchema = z.object({
  type: z.enum(["redline","observation","change"]),
  revisionId: z.string().optional(),
  projectId: z.string().optional(),
  category: z.string().optional(),
  severity: z.enum(["critical","major","minor","advisory"]).optional(),
  elementIds: z.array(z.string()).optional(),
  geometry: z.any().optional(),
  callout: z.string().optional(),
  description: z.string().optional(),
  conditionType: z.string().optional(),
  confidence: z.enum(["confirmed","reported","estimated"]).optional(),
  photos: z.array(z.string()).optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  revisionBefore: z.string().optional(),
  reason: z.string().optional(),
  urgency: z.enum(["routine","expedited","emergency"]).optional(),
  affectedScope: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json();
  const parsed = RedlineSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const now = new Date().toISOString();
  const created = { ...parsed.data, id: `${parsed.data.type}_${Date.now()}`, authorId: auth.sub, status: "open", createdAt: now };
  return NextResponse.json({ created: true, [parsed.data.type]: created });
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json({ redlines: [], observations: [], changes: [] });
}
