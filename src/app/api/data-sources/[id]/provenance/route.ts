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
    const [source] = await db
      .select()
      .from(schema.dataSources)
      .where(and(eq(schema.dataSources.id, id), eq(schema.dataSources.orgId, orgId)))
      .limit(1);

    if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Spatial overlap calculation would need PostGIS or Turf.js; here we return metadata
    return NextResponse.json({
      provenance: {
        publisher: source.publisher,
        serviceUrl: source.serviceUrl,
        license: source.license,
        attribution: source.attribution,
        crs: source.crs,
        retrievalDate: source.retrievalDate,
        featureCount: source.featureCount,
        isApproved: source.isApproved,
        metadata: source.metadata,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
