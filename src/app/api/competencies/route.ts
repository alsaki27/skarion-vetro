import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { OSP_COMPETENCIES, type ProficiencyRecord } from "@/lib/competency-model";
import { z } from "zod";

const CompetencySubmitSchema = z.object({
  studentId: z.string().min(1),
  records: z.array(z.object({ competencyId: z.string(), level: z.enum(["developing","demonstrated","proficient"]), evidence: z.array(z.object({ type: z.string(), sourceId: z.string(), score: z.number(), assessedBy: z.string(), assessedAt: z.string() })), lastUpdated: z.string(), version: z.number() })).max(100),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const studentId = request.nextUrl.searchParams.get("studentId") ?? auth.sub;
  if (auth.role === "student" && studentId !== auth.sub) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const competencies = OSP_COMPETENCIES.map((c) => ({ id: c.id, domain: c.domain, title: c.title, description: c.description, evidenceTypes: c.evidenceTypes, levels: c.proficiencyLevels }));
  return NextResponse.json({ competencies, studentId, records: [], assessedAt: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (auth.role !== "instructor" && auth.role !== "admin") return NextResponse.json({ error: "Instructor/admin required" }, { status: 403 });

  const body = await request.json();
  const parsed = CompetencySubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const results = OSP_COMPETENCIES.map((comp) => {
    const compRecords = (parsed.data.records as ProficiencyRecord[]).filter((r) => r.competencyId === comp.id);
    // Only instructors/admins can submit evidence
    const level = compRecords.length > 0 ? "demonstrated" : "developing";
    return { competencyId: comp.id, title: comp.title, level, records: compRecords.length };
  });

  return NextResponse.json({ studentId: parsed.data.studentId, results, assessedAt: new Date().toISOString() });
}
