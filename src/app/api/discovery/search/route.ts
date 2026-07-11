import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { z } from "zod";

const searchSchema = z.object({
  state: z.string().optional(),
  county: z.string().optional(),
  keywords: z.array(z.string()).default(["parcel", "address", "road"]),
});

function buildArcGISQuery(state?: string, county?: string, keywords: string[] = []) {
  const parts: string[] = [];
  if (state) parts.push(state);
  if (county) parts.push(county);
  parts.push(...keywords);
  return parts.join(" ");
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  try {
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { state, county, keywords } = parsed.data;
    const q = buildArcGISQuery(state, county, keywords);
    const url = new URL("https://www.arcgis.com/sharing/rest/search");
    url.searchParams.set("q", q);
    url.searchParams.set("f", "json");
    url.searchParams.set("num", "20");

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ error: "ArcGIS search failed" }, { status: 502 });
    }
    const data = await res.json();

    const results = (data.results ?? []).map((item: Record<string, unknown>) => ({
      title: String(item.title ?? ""),
      publisher: String(item.owner ?? item.orgName ?? "Unknown"),
      url: String(item.url ?? ""),
      description: String(item.snippet ?? ""),
      itemType: String(item.type ?? ""),
      layerCount: Number(item.numLayers ?? 0),
      extent: item.extent ?? null,
      modifiedDate: item.modified ? new Date(Number(item.modified)).toISOString() : null,
      rankScore: 0,
    }));

    // Simple ranking: boost by recency and publisher identity
    const now = Date.now();
    for (const r of results) {
      if (r.modifiedDate) {
        const daysAgo = (now - new Date(r.modifiedDate).getTime()) / (1000 * 60 * 60 * 24);
        r.rankScore += Math.max(0, 30 - daysAgo); // recency boost
      }
      if (r.publisher.toLowerCase().includes("county") || r.publisher.toLowerCase().includes("city")) {
        r.rankScore += 10; // official source boost
      }
    }
    results.sort((a: { rankScore: number }, b: { rankScore: number }) => b.rankScore - a.rankScore);

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
