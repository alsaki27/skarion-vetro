import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, status, failure_reason } = body;

    if (!job_id || !status) {
      return NextResponse.json({ error: "job_id and status required" }, { status: 400 });
    }

    const db = getDb();
    if (db) {
      await db
        .update(schema.basemapSubmissions)
        .set({
          status,
          failureReason: failure_reason ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schema.basemapSubmissions.dwgJobId, job_id));
    }

    console.log(`[DWG Ingest] Job ${job_id}: ${status}${failure_reason ? ` (${failure_reason})` : ""}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[DWG Ingest] Webhook error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
