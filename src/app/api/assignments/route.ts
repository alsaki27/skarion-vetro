import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { getAuthFromRequest } from "@/lib/auth";
import { authorize } from "@/lib/authorize";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "assignment.manage");

    const db = getDb();
    if (!db) return NextResponse.json({ assignments: [] });

    const url = new URL(request.url);
    const cohortId = url.searchParams.get("cohortId");

    const conditions = [eq(schema.assignments.orgId, auth.org_id)];
    if (cohortId) conditions.push(eq(schema.assignments.cohortId, cohortId));

    const rows = await db
      .select()
      .from(schema.assignments)
      .where(and(...conditions))
      .orderBy(schema.assignments.openAt);

    return NextResponse.json({ assignments: rows });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "assignment.manage");

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 500 });

    const body = await request.json();
    const { cohortId, projectVersionId, title, openAt, dueAt, closeAt, attemptLimit, hintPolicy } = body;

    if (!cohortId || !projectVersionId || !title || !openAt) {
      return NextResponse.json({ error: "cohortId, projectVersionId, title, and openAt required" }, { status: 400 });
    }

    const [assignment] = await db
      .insert(schema.assignments)
      .values({
        orgId: auth.org_id,
        cohortId,
        projectVersionId,
        title,
        openAt: new Date(openAt),
        dueAt: dueAt ? new Date(dueAt) : null,
        closeAt: closeAt ? new Date(closeAt) : null,
        attemptLimit: attemptLimit ?? null,
        hintPolicy: hintPolicy ?? "unlimited",
        createdBy: auth.sub,
      })
      .returning();

    return NextResponse.json({ assignment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
