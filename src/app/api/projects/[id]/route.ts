import { NextRequest, NextResponse } from "next/server";
import { PROJECTS } from "@/lib/projects";

const SAFE_FIELDS = [
  "id", "title", "difficulty", "environment", "splitArchitecture",
  "mapCenter", "mapZoom", "preloadedElements", "requirements",
  "constraints", "constraintNotes", "deliverables", "scenario",
  "tasks", "tip", "passThreshold",
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = PROJECTS[id];
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const sanitized: Record<string, unknown> = {};
  for (const key of SAFE_FIELDS) {
    sanitized[key] = (project as unknown as Record<string, unknown>)[key];
  }
  return NextResponse.json(sanitized);
}
