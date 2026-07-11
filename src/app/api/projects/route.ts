import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { curriculum } from "@/lib/curriculum";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    const orgId = auth?.org_id ?? "dev";

    const projects = await curriculum.listPublished(orgId);
    return NextResponse.json({ projects });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
