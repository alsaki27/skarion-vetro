import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const createLayerSchema = z.object({
  name: z.string().min(1),
  layerGroup: z.string().default("proposed_network"),
  layerType: z.enum(["basemap", "reference", "proposed", "existing", "annotation"]),
  sourceId: z.string().uuid().optional(),
  geometryType: z.enum(["point", "line", "polygon"]).optional(),
  visible: z.boolean().default(true),
  opacity: z.number().min(0).max(100).default(100),
  zIndex: z.number().default(0),
  style: z.record(z.string(), z.unknown()).default({}),
});

// const patchLayerSchema = z.object({
//   visible: z.boolean().optional(),
//   opacity: z.number().min(0).max(100).optional(),
//   zIndex: z.number().optional(),
//   style: z.record(z.string(), z.unknown()).optional(),
//   name: z.string().optional(),
// }).partial();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();
  const { id } = await params;

  try {
    if (!db) {
      // Dev mode without DB: return empty layers list
      return NextResponse.json({ layers: [] });
    }

    const orgId = auth?.org_id ?? "";
    const layers = await db
      .select()
      .from(schema.projectLayers)
      .where(
        and(
          eq(schema.projectLayers.projectId, id),
          eq(schema.projectLayers.orgId, orgId)
        )
      )
      .orderBy(asc(schema.projectLayers.zIndex));

    return NextResponse.json({ layers });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();
  const { id } = await params;

  try {
    if (!auth || !auth.org_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (auth.role === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createLayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const [layer] = await db
      .insert(schema.projectLayers)
      .values({
        orgId: auth.org_id,
        projectId: id,
        ...parsed.data,
      })
      .returning();

    return NextResponse.json({ layer }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
