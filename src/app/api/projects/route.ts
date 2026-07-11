import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { projectRepository } from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    const orgId = auth?.org_id ?? "dev";

    const projects = await projectRepository.listForOrg(orgId);
    return NextResponse.json({ projects });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
