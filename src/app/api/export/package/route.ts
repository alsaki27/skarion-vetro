import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { buildBOM } from "@/lib/bom-engine";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { projectId, elements, format } = await request.json();
    if (!projectId || !elements) {
      return NextResponse.json({ error: "projectId and elements required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    // Build BOM
    const bom = buildBOM(elements as never);

    // Generate GeoJSON feature collection
    const features = elements.map((el: Record<string, unknown>) => ({
      type: "Feature",
      id: el.id,
      geometry: el.geometry ?? (el.position ? { type: "Point", coordinates: el.position } : null),
      properties: { type: el.type, label: el.label, ...(el as Record<string, unknown>) },
    })).filter((f: { geometry: unknown }) => f.geometry);

    const geojson = {
      type: "FeatureCollection",
      features,
      metadata: {
        projectId,
        exportedBy: auth.sub,
        exportedAt: new Date().toISOString(),
        elementCount: features.length,
      },
    };

    // Generate checksum
    const checksum = crypto.createHash("sha256")
      .update(JSON.stringify(geojson))
      .digest("hex");

    // Build CSV
    const csvHeaders = ["id", "type", "label", "length_ft", "fiber_count", "parent_container"];
    const csvRows = [csvHeaders.join(",")];
    for (const el of elements as Array<Record<string, unknown>>) {
      csvRows.push([
        el.id, el.type, el.label ?? "", el.lengthFt ?? "", el.fiberCount ?? "", el.parentContainerId ?? "",
      ].join(","));
    }
    const csvData = csvRows.join("\n");

    // Build manifest
    const manifest = {
      projectId,
      format: format ?? "geojson+csv",
      exportedAt: new Date().toISOString(),
      exporter: auth.sub,
      checksum,
      layers: bom,
      elementCount: features.length,
      bomLineCount: bom.lines.length,
    };

    // Save export record
    const [saved] = await db.insert(schema.designSnapshots).values({
      orgId: auth.org_id,
      projectId,
      userId: auth.sub,
      snapshotData: { manifest, geojsonChecksum: checksum, elementCount: features.length },
      snapshotNote: `export-${Date.now()}`,
    }).returning();

    return NextResponse.json({
      exportId: saved.id,
      manifest,
      geojson: { checksum, featureCount: features.length },
      csv: { lineCount: csvRows.length },
      csvData,
      checksum,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
