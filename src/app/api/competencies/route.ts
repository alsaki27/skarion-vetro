import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { OSP_COMPETENCIES, assessProficiency, type ProficiencyRecord } from "@/lib/competency-model";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const studentId = request.nextUrl.searchParams.get("studentId") ?? auth.sub;

  if (auth.role === "student" && studentId !== auth.sub) {
    return NextResponse.json({ error: "Cannot view other students" }, { status: 403 });
  }

  try {
    const competencies = OSP_COMPETENCIES.map((c) => ({
      id: c.id,
      domain: c.domain,
      title: c.title,
      description: c.description,
      evidenceTypes: c.evidenceTypes,
      levels: c.proficiencyLevels,
    }));

    return NextResponse.json({
      competencies,
      studentId,
      records: [],
      assessedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { studentId, records } = await request.json();
    if (!studentId || !records) {
      return NextResponse.json({ error: "studentId and records required" }, { status: 400 });
    }

    const results = OSP_COMPETENCIES.map((comp) => {
      const compRecords = (records as ProficiencyRecord[]).filter((r) => r.competencyId === comp.id);
      const level = assessProficiency(compRecords, comp);
      return { competencyId: comp.id, title: comp.title, level, records: compRecords.length };
    });

    return NextResponse.json({ studentId, results, assessedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
