import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { z } from "zod";

const countiesQuery = z.object({
  stateFips: z.string().length(2),
});

// Seeded census county data — in production this would query TIGER/Line or a cached table
const CENSUS_COUNTIES: Record<string, Array<{ fips: string; name: string }>> = {
  "48": [ // Texas
    { fips: "453", name: "Travis County" },
    { fips: "201", name: "Harris County" },
    { fips: "439", name: "Tarrant County" },
    { fips: "091", name: "Dallas County" },
    { fips: "029", name: "Bexar County" },
  ],
  "06": [ // California
    { fips: "037", name: "Los Angeles County" },
    { fips: "075", name: "San Francisco County" },
    { fips: "073", name: "San Diego County" },
  ],
  "36": [ // New York
    { fips: "061", name: "New York County" },
    { fips: "081", name: "Queens County" },
    { fips: "047", name: "Kings County" },
  ],
  "12": [ // Florida
    { fips: "086", name: "Miami-Dade County" },
    { fips: "095", name: "Orange County" },
    { fips: "099", name: "Palm Beach County" },
  ],
};

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  try {
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stateFips = searchParams.get("stateFips");
    const parsed = countiesQuery.safeParse({ stateFips });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const counties = CENSUS_COUNTIES[parsed.data.stateFips] ?? [];
    return NextResponse.json({ counties });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
