import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";
import { eq, and, count, asc } from "drizzle-orm";
import { z } from "zod";

const querySchema = z.object({
  layerType: z.string().optional().default("all"),
  filter: z.string().optional().default(""),
  page: z.coerce.number().min(0).optional().default(0),
  pageSize: z.coerce.number().min(1).max(200).optional().default(50),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required", error_code: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message, error_code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { layerType, filter: filterText, page, pageSize } = parsed.data;
  const db = getDb();

  if (!db) {
    return NextResponse.json({ features: [], total: 0, page: 0, pageSize });
  }

  try {
    const conditions = [eq(schema.networkElements.orgId, auth.org_id)];
    if (layerType !== "all") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conditions.push(eq(schema.networkElements.elementType, layerType as any));
    }

    const where = and(...conditions);
    const totalResult = await db.select({ value: count() }).from(schema.networkElements).where(where);
    const total = totalResult[0]?.value ?? 0;

    const rows = await db.select()
      .from(schema.networkElements)
      .where(where)
      .orderBy(asc(schema.networkElements.createdAt))
      .limit(pageSize)
      .offset(page * pageSize);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let features = rows as any[];
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      features = features.filter((f: any) =>
        (f.label ?? "").toLowerCase().includes(q) ||
        (f.id ?? "").toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ features, total, page, pageSize });
  } catch (err) {
    return NextResponse.json({ error: String(err), error_code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
