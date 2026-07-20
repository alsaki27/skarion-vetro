import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { type Redline, type FieldObservation, type DesignChange } from "@/lib/redline-model";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === "redline") {
      const redline: Redline = {
        id: `redline_${Date.now()}`,
        revisionId: data.revisionId,
        authorId: auth.sub,
        category: data.category ?? "documentation",
        severity: data.severity ?? "minor",
        elementIds: data.elementIds ?? [],
        geometry: data.geometry,
        callout: data.callout ?? "",
        description: data.description ?? "",
        status: "open",
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ created: true, redline });
    }

    if (type === "observation") {
      const obs: FieldObservation = {
        id: `obs_${Date.now()}`,
        projectId: data.projectId,
        authorId: auth.sub,
        featureId: data.featureId,
        conditionType: data.conditionType ?? "other",
        confidence: data.confidence ?? "reported",
        description: data.description ?? "",
        photos: data.photos,
        coordinates: data.coordinates,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ created: true, observation: obs });
    }

    if (type === "change") {
      const change: DesignChange = {
        id: `change_${Date.now()}`,
        projectId: data.projectId,
        revisionBefore: data.revisionBefore,
        initiatorId: auth.sub,
        reason: data.reason ?? "",
        urgency: data.urgency ?? "routine",
        affectedScope: data.affectedScope ?? [],
        status: "draft",
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ created: true, change });
    }

    return NextResponse.json({ error: "Type must be redline, observation, or change" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    return NextResponse.json({
      redlines: [],
      observations: [],
      changes: [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
