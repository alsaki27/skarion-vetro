import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
// import { buildContext } from "@/lib/grading/engine";
// import { PROJECTS } from "@/lib/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  const { id } = await params;

  try {
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Relationships are computed from the design snapshot in store (for now)
    // In a full implementation, this would query network_elements and build graph
    return NextResponse.json({
      elementId: id,
      neighbors: [],
      upstream: [],
      downstream: [],
      contained: [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
