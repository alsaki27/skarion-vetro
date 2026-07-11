import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();
  const { id } = await params;

  try {
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const orgId = auth?.org_id ?? "";
    const [area] = await db
      .select()
      .from(schema.studyAreas)
      .where(and(eq(schema.studyAreas.id, id), eq(schema.studyAreas.orgId, orgId)))
      .limit(1);

    if (!area) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ studyArea: area });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
