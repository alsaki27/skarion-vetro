import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { PROJECTS } from "@/lib/projects";

const SAFE_FIELDS = [
  "id", "title", "difficulty", "environment", "splitArchitecture",
  "mapCenter", "mapZoom", "preloadedElements", "requirements",
  "constraints", "constraintNotes", "deliverables", "scenario",
  "tasks", "tip", "passThreshold",
] as const;

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
  if (!project) {
    return NextResponse.json({ error: "Project not found", error_code: "NOT_FOUND" }, { status: 404 });
  }
  const sanitized: Record<string, unknown> = {};
  for (const key of SAFE_FIELDS) {
    sanitized[key] = (project as unknown as Record<string, unknown>)[key];
  }
  return NextResponse.json(sanitized);
}
