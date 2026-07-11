import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createStudyAreaSchema = z.object({
  name: z.string().min(1),
  stateFips: z.string().length(2),
  countyFips: z.string().length(3).optional(),
  countyName: z.string().optional(),
  stateAbbrev: z.string().length(2).optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  geometry: z.string().min(1),
  crsPreference: z.string().default("EPSG:4326"),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    if (!db) return NextResponse.json({ studyAreas: [] });
    const orgId = auth?.org_id ?? "";
    const areas = await db
      .select()
      .from(schema.studyAreas)
      .where(eq(schema.studyAreas.orgId, orgId))
      .orderBy(desc(schema.studyAreas.createdAt));
    return NextResponse.json({ studyAreas: areas });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    if (!auth || !auth.org_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createStudyAreaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const [area] = await db
      .insert(schema.studyAreas)
      .values({ orgId: auth.org_id, ...parsed.data })
      .returning();

    return NextResponse.json({ studyArea: area }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
