import { NextRequest, NextResponse } from "next/server";

// Receives status webhooks from the DWG Ingest sidecar
// In production, verify the webhook origin via shared secret

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, status, failure_reason } = body;

    // Log the status update
    console.log(`[DWG Ingest] Job ${job_id}: ${status}${failure_reason ? ` (${failure_reason})` : ""}`);

    // TODO: In production, update the basemap_submissions row in the database
    // await db.update(basemapSubmissions).set({ status, failureReason: failure_reason })
    //   .where(eq(basemapSubmissions.dwgJobId, job_id));

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
