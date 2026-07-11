import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1),
  sourceType: z.string().min(1),
  countyFips: z.string().optional(),
  mappings: z.array(z.object({ sourceField: z.string(), targetField: z.string(), transform: z.string().optional() })),
  isShared: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    if (!db) return NextResponse.json({ templates: [] });
    const orgId = auth?.org_id ?? "";
    const templates = await db
      .select()
      .from(schema.fieldMappingTemplates)
      .where(
        and(
          eq(schema.fieldMappingTemplates.orgId, orgId),
          eq(schema.fieldMappingTemplates.isShared, true)
        )
      )
      .orderBy(desc(schema.fieldMappingTemplates.createdAt));
    return NextResponse.json({ templates });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  const db = getDb();

  try {
    if (!auth || !auth.org_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const [template] = await db
      .insert(schema.fieldMappingTemplates)
      .values({
        orgId: auth.org_id,
        createdBy: auth.sub,
        ...parsed.data,
      })
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
