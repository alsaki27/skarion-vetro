import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { getAuthFromRequest } from "@/lib/auth";
import { authorize } from "@/lib/authorize";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "cohort.manage");

    const db = getDb();
    if (!db) return NextResponse.json({ cohorts: [] });

    const rows = await db
      .select()
      .from(schema.cohorts)
      .where(and(eq(schema.cohorts.orgId, auth.org_id), eq(schema.cohorts.status, "active")))
      .orderBy(schema.cohorts.name);

    return NextResponse.json({ cohorts: rows });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "cohort.manage");

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 500 });

    const body = await request.json();
    const { name, slug, description, timezone } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug required" }, { status: 400 });
    }

    const [cohort] = await db
      .insert(schema.cohorts)
      .values({
        orgId: auth.org_id,
        name,
        slug,
        description: description ?? null,
        timezone: timezone ?? "UTC",
      })
      .returning();

    return NextResponse.json({ cohort }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
