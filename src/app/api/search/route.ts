import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const projectId = searchParams.get("projectId") ?? "";

    if (!db) return NextResponse.json({ results: [] });
    const orgId = auth?.org_id ?? "";

    const roads = await db
      .select()
      .from(schema.roadSegments)
      .where(
        and(
          eq(schema.roadSegments.orgId, orgId),
          projectId ? eq(schema.roadSegments.projectId, projectId) : undefined,
          sql`${schema.roadSegments.roadName} ILIKE ${`%${q}%`}`
        )
      )
      .limit(20);

    const addresses = await db
      .select()
      .from(schema.addressPoints)
      .where(
        and(
          eq(schema.addressPoints.orgId, orgId),
          projectId ? eq(schema.addressPoints.projectId, projectId) : undefined,
          sql`(
            COALESCE(${schema.addressPoints.houseNumber}, '') || ' ' ||
            COALESCE(${schema.addressPoints.streetName}, '')
          ) ILIKE ${`%${q}%`}`
        )
      )
      .limit(20);

    return NextResponse.json({
      roads: roads.map((r) => ({
        id: r.id,
        name: r.roadName,
        type: "road",
        geometry: r.geometry,
      })),
      addresses: addresses.map((a) => ({
        id: a.id,
        address: `${a.houseNumber ?? ""} ${a.streetName ?? ""} ${a.streetType ?? ""}`.trim(),
        type: "address",
        geometry: a.geometry,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
