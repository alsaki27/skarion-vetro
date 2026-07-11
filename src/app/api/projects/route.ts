import { NextResponse } from "next/server";
import { PROJECTS } from "@/lib/projects";

// Only expose fields safe for students — never grading answer keys
const PUBLIC_PROJECT_FIELDS = [
  "id", "title", "difficulty", "environment", "splitArchitecture",
  "mapCenter", "mapZoom", "preloadedElements", "requirements",
  "constraints", "constraintNotes", "deliverables", "scenario",
  "tasks", "tip", "passThreshold",
] as const;

export async function GET() {
  const projects = Object.values(PROJECTS).map((p) => {
    const sanitized: Record<string, unknown> = {};
    for (const key of PUBLIC_PROJECT_FIELDS) {
      sanitized[key] = (p as unknown as Record<string, unknown>)[key];
    }
    return sanitized;
  });
  return NextResponse.json({ projects });
}
