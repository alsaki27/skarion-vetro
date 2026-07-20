import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { DEFAULT_STANDARDS, validateProfile, detectConflicts } from "@/lib/standards-profiles";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    return NextResponse.json({
      default: DEFAULT_STANDARDS,
      profiles: [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (auth.role !== "instructor" && auth.role !== "admin") {
    return NextResponse.json({ error: "Instructor or admin required" }, { status: 403 });
  }

  try {
    const { name, jurisdiction, rules, source, sourceTitle } = await request.json();
    if (!name || !rules) return NextResponse.json({ error: "name and rules required" }, { status: 400 });

    const validation = validateProfile(rules);
    if (!validation.valid) {
      return NextResponse.json({ error: "Invalid profile", errors: validation.errors }, { status: 400 });
    }

    const conflicts = detectConflicts(DEFAULT_STANDARDS, rules);

    return NextResponse.json({
      created: true,
      profile: {
        id: `profile_${Date.now()}`,
        orgId: auth.org_id,
        name,
        version: 1,
        jurisdiction: jurisdiction ?? "default",
        source: source ?? "custom",
        sourceTitle: sourceTitle ?? name,
        effectiveDate: new Date().toISOString(),
        rules,
        conflicts: conflicts.length > 0 ? conflicts : null,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
