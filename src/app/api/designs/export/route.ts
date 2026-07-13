import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { PROJECTS } from "@/lib/projects";
import { buildBOM } from "@/lib/bom-engine";
import type { NetworkElement } from "@/lib/types";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);

  try {
    const body = await request.json() as Record<string, unknown>;
    const projectId = body.projectId as string | undefined;
    const elements = body.elements as NetworkElement[] | undefined;
    if (!projectId || !elements) {
      return NextResponse.json({ error: "projectId and elements required" }, { status: 400 });
    }

    const project = PROJECTS[projectId];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build GeoJSON feature collection
    const features: GeoJSON.Feature[] = [];
    for (const el of elements) {
      if ("position" in el && el.position) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: el.position },
          properties: { id: el.id, type: el.type, label: el.label, ...(el.attributes as Record<string, unknown> ?? {}) },
        });
      } else if ("path" in el && el.path) {
        features.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: el.path },
          properties: { id: el.id, type: el.type, label: el.label, ...(el.attributes as Record<string, unknown> ?? {}) },
        });
      }
    }
    const geojson = JSON.stringify({ type: "FeatureCollection", features });
    const geojsonChecksum = createHash("sha256").update(geojson).digest("hex").substring(0, 16);

    // Build BOM CSV
    const placements = elements
      .map((el) => {
        const catKey = (el.attributes as Record<string, unknown>)?.catalog_key as string | undefined
          ?? (el.type === "handhole" ? "handhole_17x30"
            : el.type === "conduit" ? "conduit_1.5"
            : el.type === "cable" ? "cable_144f"
            : null);
        return catKey ? { catalogKey: catKey, quantity: 1, featureId: el.id } : null;
      })
      .filter(Boolean) as { catalogKey: string; quantity: number; featureId: string }[];
    const bom = placements.length > 0 ? buildBOM(placements) : null;
    const csvLines = bom
      ? ["item,spec,qty,unit", ...bom.lines.map((l) => `${l.description},${l.catalogItemId},${l.designedQuantity},${l.unit}`)]
      : ["item,spec,qty,unit"];
    const csv = csvLines.join("\n");
    const csvChecksum = createHash("sha256").update(csv).digest("hex").substring(0, 16);

    // Manifest
    const manifest = {
      projectId,
      exportedAt: new Date().toISOString(),
      userId: auth?.sub ?? "anonymous",
      featureCount: features.length,
      bomLineItems: bom?.lines.length ?? 0,
      checksums: {
        geojson: geojsonChecksum,
        csv: csvChecksum,
      },
      crs: "EPSG:4326",
    };

    return NextResponse.json({
      manifest,
      geojson: geojsonChecksum, // returned as verification key only (file too large for JSON)
      csv,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
