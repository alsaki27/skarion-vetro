import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (auth.role !== "admin") return NextResponse.json({ error: "Admin required" }, { status: 403 });

  try {
    const { templateId, action, reason } = await request.json();
    if (!templateId || !action) {
      return NextResponse.json({ error: "templateId and action required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    const [template] = await db.select()
      .from(schema.basemapTemplates)
      .where(and(
        eq(schema.basemapTemplates.id, templateId),
        eq(schema.basemapTemplates.orgId, auth.org_id),
      ))
      .limit(1);

    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    if (action === "approve") {
      await db.update(schema.basemapTemplates)
        .set({ isActive: true })
        .where(eq(schema.basemapTemplates.id, templateId));
    } else if (action === "reject") {
      await db.update(schema.basemapTemplates)
        .set({ isActive: false })
        .where(eq(schema.basemapTemplates.id, templateId));
    }

    return NextResponse.json({
      templateId,
      action,
      reason: reason ?? "",
      approved: action === "approve",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const templateId = request.nextUrl.searchParams.get("templateId");

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    const conditions = [eq(schema.basemapSubmissions.orgId, auth.org_id)];
    if (templateId) conditions.push(eq(schema.basemapSubmissions.templateId, templateId));

    const submissions = await db.select()
      .from(schema.basemapSubmissions)
      .where(and(...conditions));

    const pending = submissions.filter((s) => ["uploaded", "converting", "extracting"].includes(s.status));
    const ready = submissions.filter((s) => s.status === "ready");
    const failed = submissions.filter((s) => s.status === "failed");

    return NextResponse.json({
      total: submissions.length,
      pending: pending.length,
      ready: ready.length,
      failed: failed.length,
      submissions: submissions.map((s) => ({
        id: s.id,
        status: s.status,
        dwgFilename: s.dwgFilename,
        dwgSizeBytes: s.dwgSizeBytes,
        geojsonLayers: s.geojsonLayers,
        failureReason: s.failureReason,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
