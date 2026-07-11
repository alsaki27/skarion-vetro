import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const patchLayerSchema = z.object({
  visible: z.boolean().optional(),
  opacity: z.number().min(0).max(100).optional(),
  zIndex: z.number().optional(),
  style: z.record(z.string(), z.unknown()).optional(),
  name: z.string().optional(),
}).partial();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; layerId: string }> },
) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();
  const { id: projectId, layerId } = await params;

  try {
    if (!auth || !auth.org_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchLayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const [updated] = await db
      .update(schema.projectLayers)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.projectLayers.id, layerId),
          eq(schema.projectLayers.projectId, projectId),
          eq(schema.projectLayers.orgId, auth.org_id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Layer not found" }, { status: 404 });
    }

    return NextResponse.json({ layer: updated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; layerId: string }> },
) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();
  const { id: projectId, layerId } = await params;

  try {
    if (!auth || !auth.org_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (auth.role === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const [deleted] = await db
      .delete(schema.projectLayers)
      .where(
        and(
          eq(schema.projectLayers.id, layerId),
          eq(schema.projectLayers.projectId, projectId),
          eq(schema.projectLayers.orgId, auth.org_id)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Layer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
