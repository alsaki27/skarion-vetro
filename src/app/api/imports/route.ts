import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createImportSchema = z.object({
  sourceId: z.string().uuid().optional(),
  projectId: z.string().uuid(),
  targetLayerId: z.string().uuid().optional(),
  fieldMapping: z.record(z.string(), z.string()).optional(),
  appendBehavior: z.enum(["append", "replace", "update"]).default("append"),
  uploadJobId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    if (!auth || !auth.org_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const [job] = await db
      .insert(schema.importJobs)
      .values({
        orgId: auth.org_id,
        sourceId: parsed.data.sourceId ?? null,
        projectId: parsed.data.projectId,
        targetLayerId: parsed.data.targetLayerId ?? null,
        fieldMapping: parsed.data.fieldMapping ?? {},
        appendBehavior: parsed.data.appendBehavior,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    if (!db) return NextResponse.json({ jobs: [] });
    const orgId = auth?.org_id ?? "";
    const jobs = await db
      .select()
      .from(schema.importJobs)
      .where(eq(schema.importJobs.orgId, orgId))
      .orderBy(schema.importJobs.createdAt);
    return NextResponse.json({ jobs });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
