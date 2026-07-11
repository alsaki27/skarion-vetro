import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

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
    const [source] = await db
      .select()
      .from(schema.dataSources)
      .where(and(eq(schema.dataSources.id, id), eq(schema.dataSources.orgId, orgId)))
      .limit(1);

    if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const versions = await db
      .select()
      .from(schema.dataSourceVersions)
      .where(eq(schema.dataSourceVersions.sourceId, id))
      .orderBy(desc(schema.dataSourceVersions.versionNumber));

    return NextResponse.json({ source, versions });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
