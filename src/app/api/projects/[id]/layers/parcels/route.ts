import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { loadParcels } from "@/lib/basemap-loader";
import { PROJECTS } from "@/lib/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required", error_code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const project = PROJECTS[id];

  // Cross-tenant: return 404, not 403, to avoid leaking project existence
  if (!project || !project.orgId || !project.basemapId) {
    return NextResponse.json({ error: "Not found", error_code: "NOT_FOUND" }, { status: 404 });
  }

  if (auth.org_id !== project.orgId) {
    return NextResponse.json({ error: "Not found", error_code: "NOT_FOUND" }, { status: 404 });
  }

  const basemapId = project.basemapId;
  if (basemapId !== "wilco-l131725c") {
    return NextResponse.json({ error: "Not found", error_code: "NOT_FOUND" }, { status: 404 });
  }
  const { valid, rejected } = loadParcels(basemapId);

  return NextResponse.json({
    type: "FeatureCollection",
    features: valid.map((p) => ({
      type: "Feature",
      id: p.id,
      geometry: p.geometry,
      properties: p.properties,
    })),
    metadata: {
      layer: "parcels",
      basemapId,
      count: valid.length,
      rejected,
      source: "WCAD Tax Parcels (public domain)",
      license: "Williamson County public GIS data",
    },
  });
}
