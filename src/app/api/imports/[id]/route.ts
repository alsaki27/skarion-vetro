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
    const [job] = await db
      .select()
      .from(schema.importJobs)
      .where(and(eq(schema.importJobs.id, id), eq(schema.importJobs.orgId, orgId)))
      .limit(1);

    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
