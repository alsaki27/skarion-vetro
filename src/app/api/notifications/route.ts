import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const NotificationQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = NotificationQuerySchema.safeParse(params);
  const limit = query.success ? query.data.limit : 20;

  try {
    const db = getDb();
    if (!db) return NextResponse.json({ notifications: [], unreadCount: 0, total: 0 });

    const conditions = [eq(schema.notifications.userId, auth.sub), eq(schema.notifications.orgId, auth.org_id)];
    const rows = await db.select().from(schema.notifications)
      .where(and(...conditions))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);

    const unreadCount = rows.filter((r) => !r.isRead).length;

    return NextResponse.json({
      notifications: rows.map((r) => ({ id: r.id, type: r.type, title: r.title, body: r.body, link: r.link, isRead: r.isRead, createdAt: r.createdAt })),
      unreadCount,
      total: rows.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
