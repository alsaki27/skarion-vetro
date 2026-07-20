import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { DEFAULT_STANDARDS, validateProfile, detectConflicts } from "@/lib/standards-profiles";
import { z } from "zod";

const ProfileSchema = z.object({
  name: z.string().min(1).max(100),
  jurisdiction: z.string().max(100).optional(),
  rules: z.object({
    maxPoleSpanFt: z.number().int().min(1).max(1000),
    maxDropCableFt: z.number().int().min(1).max(500),
    minClearanceFt: z.number().min(0),
    maxBendRadiusIn: z.number().min(1),
    slackPerSpliceFt: z.number().min(0),
    reserveCapacityPct: z.number().int().min(0).max(50),
    structureHosting: z.record(z.string(), z.object({ maxCount: z.number().int().min(1), allowed: z.array(z.string()) })),
    namingConvention: z.object({ prefix: z.string(), startNumber: z.number().int(), format: z.string() }),
    materials: z.object({ approved: z.array(z.string()), deprecated: z.array(z.string()) }),
    documentationRequirements: z.array(z.string()),
  }),
  source: z.string().max(200).optional(),
  sourceTitle: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json({ default: DEFAULT_STANDARDS, profiles: [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (auth.role !== "instructor" && auth.role !== "admin") return NextResponse.json({ error: "Instructor or admin required" }, { status: 403 });

  const body = await request.json();
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile", details: parsed.error.flatten() }, { status: 400 });

  const validation = validateProfile(parsed.data.rules);
  if (!validation.valid) return NextResponse.json({ error: "Invalid profile rules", errors: validation.errors }, { status: 400 });

  const conflicts = detectConflicts(DEFAULT_STANDARDS, parsed.data.rules);
  const profile = { id: `profile_${Date.now()}`, orgId: auth.org_id, name: parsed.data.name, version: 1, jurisdiction: parsed.data.jurisdiction ?? "default", effectiveDate: new Date().toISOString(), source: parsed.data.source ?? "custom", sourceTitle: parsed.data.sourceTitle ?? parsed.data.name, rules: parsed.data.rules, conflicts: conflicts.length > 0 ? conflicts : null };
  return NextResponse.json({ created: true, profile });
}
