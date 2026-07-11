import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { z } from "zod";

const previewQuery = z.object({
  url: z.string().url(),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  try {
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get("url");
    const parsed = previewQuery.safeParse({ url: urlParam });
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid url parameter" }, { status: 400 });
    }

    const baseUrl = parsed.data.url.replace(/\/?$/, "");

    // Fetch layer metadata
    const layersRes = await fetch(`${baseUrl}/layers?f=json`);
    if (!layersRes.ok) {
      return NextResponse.json({ error: "Failed to fetch layer metadata" }, { status: 502 });
    }
    const layersData = await layersRes.json();

    const layers = (layersData.layers ?? []).map((l: Record<string, unknown>) => ({
      id: Number(l.id ?? 0),
      name: String(l.name ?? ""),
      geometryType: String(l.geometryType ?? ""),
      recordCount: Number(l.count ?? 0),
    }));

    // Fetch sample features from first layer
    const fields: Record<string, unknown>[] = [];
    let sampleFeatures: Record<string, unknown>[] = [];
    let geometryType = "";
    let recordCount = 0;
    let crs = "";

    if (layers.length > 0) {
      const firstLayerId = layers[0].id;
      const queryRes = await fetch(
        `${baseUrl}/${firstLayerId}/query?where=1=1&resultRecordCount=5&f=json`
      );
      if (queryRes.ok) {
        const queryData = await queryRes.json();
        fields.push(...(queryData.fields ?? []));
        sampleFeatures = (queryData.features ?? []).slice(0, 5);
        geometryType = String(queryData.geometryType ?? "");
        recordCount = Number(queryData.count ?? 0);
        if (queryData.spatialReference) {
          crs = String(queryData.spatialReference.wkid ?? queryData.spatialReference.wkt ?? "");
        }
      }
    }

    return NextResponse.json({
      layers,
      fields,
      sampleFeatures,
      geometryType,
      recordCount,
      crs,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
