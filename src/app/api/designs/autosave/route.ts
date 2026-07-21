import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { AutosaveSchema } from "@/lib/api-schemas";
import { resolveProjectId } from "@/lib/project-resolver";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = AutosaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { elements, note, baseRevision } = parsed.data;
    const projectId = await resolveProjectId(parsed.data.projectId, auth.org_id);
    if (!projectId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database required for autosave" }, { status: 503 });
    }

    const [existing] = await db.select({ id: schema.designSnapshots.id, snapshotData: schema.designSnapshots.snapshotData })
      .from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.projectId, projectId),
        eq(schema.designSnapshots.userId, auth.sub),
        eq(schema.designSnapshots.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.designSnapshots.createdAt))
      .limit(1);

    // ETag conflict check — reject stale saves
    if (baseRevision && existing && existing.id !== baseRevision) {
      return NextResponse.json({
        error: "Stale save — your design is out of date",
        error_code: "STALE_REVISION",
        serverRevision: existing.id,
        clientRevision: baseRevision,
      }, { status: 409 });
    }

    // Working head: upsert instead of unbounded insert for autosaves
    // Named checkpoints and submissions create separate immutable rows
    const result = await db.insert(schema.designSnapshots).values({
      orgId: auth.org_id,
      projectId,
      userId: auth.sub,
      snapshotData: { elements, savedAt: new Date().toISOString() },
      snapshotNote: note ?? "autosave",
    }).returning();

    // Cleanup: delete older autosave-only snapshots beyond 10, keeping the working head
    // Named checkpoints (note starting with "checkpoint:" or "submission-") are preserved
    if (result.length > 0) {
      const autosaveRows = await db.select({ id: schema.designSnapshots.id, snapshotNote: schema.designSnapshots.snapshotNote })
        .from(schema.designSnapshots)
        .where(and(
          eq(schema.designSnapshots.projectId, projectId),
          eq(schema.designSnapshots.userId, auth.sub),
          eq(schema.designSnapshots.orgId, auth.org_id),
        ))
        .orderBy(desc(schema.designSnapshots.createdAt));

      const autosaves = autosaveRows.filter((r) => !r.snapshotNote?.startsWith("checkpoint:") && !r.snapshotNote?.startsWith("submission-"));
      if (autosaves.length > 10) {
        const toDelete = autosaves.slice(10);
        for (const row of toDelete) {
          await db.delete(schema.designSnapshots).where(eq(schema.designSnapshots.id, row.id));
        }
      }
    }

    return NextResponse.json({
      saved: true,
      revision: result[0].id,
      previousRevision: existing?.id ?? null,
      etag: `${result[0].id}:${new Date(result[0].createdAt!).getTime()}`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const rawId = request.nextUrl.searchParams.get("projectId");
  if (!rawId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  try {
    const projectId = await resolveProjectId(rawId, auth.org_id);
    if (!projectId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database required" }, { status: 503 });
    }

    const snapshots = await db.select()
      .from(schema.designSnapshots)
      .where(and(
        eq(schema.designSnapshots.projectId, projectId),
        eq(schema.designSnapshots.userId, auth.sub),
        eq(schema.designSnapshots.orgId, auth.org_id),
      ))
      .orderBy(desc(schema.designSnapshots.createdAt))
      .limit(20);

    const latest = snapshots.length > 0 ? snapshots[0] : null;
    return NextResponse.json({
      history: snapshots.map((s) => ({ id: s.id, note: s.snapshotNote, createdAt: s.createdAt })),
      latest: latest ? { id: latest.id, data: latest.snapshotData, createdAt: latest.createdAt } : null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
