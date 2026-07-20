import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { designId, comment, elementId, anchor } = await request.json();
    if (!designId || !comment) {
      return NextResponse.json({ error: "designId and comment required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    const [review] = await db.insert(schema.reviewComments).values({
      orgId: auth.org_id,
      revisionId: designId,
      elementId: elementId ?? null,
      authorId: auth.sub,
      text: comment,
      anchor: anchor ?? {},
      status: "open",
    }).returning();

    return NextResponse.json({ reviewId: review.id, status: review.status, createdAt: review.createdAt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const designId = request.nextUrl.searchParams.get("designId");
  if (!designId) return NextResponse.json({ error: "designId required" }, { status: 400 });

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    const comments = await db.select()
      .from(schema.reviewComments)
      .where(and(
        eq(schema.reviewComments.revisionId, designId),
        eq(schema.reviewComments.orgId, auth.org_id),
      ))
      .orderBy(schema.reviewComments.createdAt);

    return NextResponse.json({ comments });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { commentId, status } = await request.json();
    if (!commentId || !status) {
      return NextResponse.json({ error: "commentId and status required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 503 });

    await db.update(schema.reviewComments)
      .set({
        status,
        resolvedAt: status === "resolved_by_instructor" ? new Date() : null,
      })
      .where(and(
        eq(schema.reviewComments.id, commentId),
        eq(schema.reviewComments.orgId, auth.org_id),
      ));

    return NextResponse.json({ resolved: true, status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
