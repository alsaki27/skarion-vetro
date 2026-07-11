import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getAuthFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 500 });

    const body = await request.json();
    const { templateId, dwgKey, dwgFilename, dwgSizeBytes } = body;
    if (!templateId) {
      return NextResponse.json({ error: "templateId required" }, { status: 400 });
    }

    const [submission] = await db
      .insert(schema.basemapSubmissions)
      .values({
        orgId: auth.org_id,
        templateId,
        userId: auth.sub,
        status: "uploaded",
        dwgKey: dwgKey ?? null,
        dwgFilename: dwgFilename ?? null,
        dwgSizeBytes: dwgSizeBytes ?? null,
      })
      .returning();

    return NextResponse.json({ submission }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
