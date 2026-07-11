import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { PROJECTS } from "@/lib/projects";

const PUBLIC_PROJECT_FIELDS = [
  "id", "title", "difficulty", "environment", "splitArchitecture",
  "mapCenter", "mapZoom", "preloadedElements", "requirements",
  "constraints", "constraintNotes", "deliverables", "scenario",
  "tasks", "tip", "passThreshold",
] as const;

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required", error_code: "UNAUTHORIZED" }, { status: 401 });
  }

  const projects = Object.values(PROJECTS).map((p) => {
    const sanitized: Record<string, unknown> = {};
    for (const key of PUBLIC_PROJECT_FIELDS) {
      sanitized[key] = (p as unknown as Record<string, unknown>)[key];
    }
    return sanitized;
  });
  return NextResponse.json({ projects });
}
