import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createDataSourceSchema = z.object({
  name: z.string().min(1),
  sourceType: z.enum(["arcgis_featureserver", "shapefile", "geojson", "kml", "census_tiger", "overture", "openaddresses"]),
  publisher: z.string().min(1),
  serviceUrl: z.string().url().optional(),
  description: z.string().optional(),
  license: z.string().optional(),
  attribution: z.string().optional(),
  crs: z.string().optional(),
  geometryType: z.string().optional(),
  featureCount: z.number().optional(),
  checksum: z.string().optional(),
  refreshPolicy: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    if (!db) return NextResponse.json({ sources: [] });
    const orgId = auth?.org_id ?? "";
    const sources = await db
      .select()
      .from(schema.dataSources)
      .where(eq(schema.dataSources.orgId, orgId))
      .orderBy(desc(schema.dataSources.createdAt));
    return NextResponse.json({ sources });
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
    const parsed = createDataSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const [source] = await db
      .insert(schema.dataSources)
      .values({ orgId: auth.org_id, ...parsed.data })
      .returning();

    // Create initial version snapshot
    await db.insert(schema.dataSourceVersions).values({
      sourceId: source.id,
      versionNumber: 1,
      schemaSnapshot: {},
      featureCount: source.featureCount,
      checksum: source.checksum,
      importedAt: new Date(),
      importedBy: auth.sub,
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
