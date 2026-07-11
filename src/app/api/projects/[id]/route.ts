import { NextRequest, NextResponse } from "next/server";
import { PROJECTS } from "@/lib/projects";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = PROJECTS[id];
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}
