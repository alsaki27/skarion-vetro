import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthFromRequest } from "@/lib/auth";
import { authorize } from "@/lib/authorize";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "project.create");

    const db = getDb();
    if (!db) return NextResponse.json({ projects: [] });

    const projects = await db
      .select()
      .from(schema.curriculumProjects)
      .where(eq(schema.curriculumProjects.orgId, auth.org_id))
      .orderBy(schema.curriculumProjects.title);

    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "project.create");

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 500 });

    const body = await request.json();
    const { slug, title, description, difficulty, environment, splitArchitecture } = body;

    if (!slug || !title || !difficulty || !environment) {
      return NextResponse.json({ error: "slug, title, difficulty, and environment required" }, { status: 400 });
    }

    const [project] = await db
      .insert(schema.curriculumProjects)
      .values({
        orgId: auth.org_id,
        slug,
        title,
        description: description ?? "",
        difficulty,
        environment,
        splitArchitecture: splitArchitecture ?? "n/a",
        state: "draft",
      })
      .returning();

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
