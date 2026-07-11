import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { loadAddresses } from "@/lib/basemap-loader";
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

  const { valid, rejected } = loadAddresses(basemapId);

  return NextResponse.json({
    type: "FeatureCollection",
    features: valid.map((a) => ({
      type: "Feature",
      id: a.id,
      geometry: a.geometry,
      properties: {
        ...a.properties,
        serviceable: a.properties.status === "OPEN" && a.properties.address_type === "SINGLE FAMILY",
      },
    })),
    metadata: {
      layer: "addresses",
      basemapId,
      count: valid.length,
      rejected,
      source: "Williamson County 911 Addressing",
      license: "Williamson County public records",
    },
  });
}
