import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and, ne } from "drizzle-orm";
import { getAuthFromRequest } from "@/lib/auth";
import { authorize } from "@/lib/authorize";
import { writeAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "member.manage");

    const db = getDb();
    if (!db) return NextResponse.json({ members: [] });

    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const validRoles = ["student", "instructor", "admin"] as const;
    const validStatuses = ["active", "invited", "deactivated"] as const;
    const conditions = [eq(schema.orgMembers.orgId, auth.org_id)];
    if (role && validRoles.includes(role as typeof validRoles[number])) {
      conditions.push(eq(schema.orgMembers.role, role as typeof validRoles[number]));
    }
    if (status && validStatuses.includes(status as typeof validStatuses[number])) {
      conditions.push(eq(schema.orgMembers.status, status as typeof validStatuses[number]));
    }

    const members = await db
      .select({
        userId: schema.orgMembers.userId,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.orgMembers.role,
        status: schema.orgMembers.status,
        lastLoginAt: schema.users.lastLoginAt,
        joinedAt: schema.orgMembers.joinedAt,
      })
      .from(schema.orgMembers)
      .innerJoin(schema.users, eq(schema.orgMembers.userId, schema.users.id))
      .where(and(...conditions))
      .orderBy(schema.users.name);

    const filtered = search
      ? members.filter(
          (m) =>
            m.email.toLowerCase().includes(search.toLowerCase()) ||
            m.name.toLowerCase().includes(search.toLowerCase()),
        )
      : members;

    return NextResponse.json({ members: filtered });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    authorize({ userId: auth.sub, orgId: auth.org_id, role: auth.role, isPlatformStaff: false }, "member.manage");

    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database required" }, { status: 500 });

    const body = await request.json();
    const { userId, action } = body;
    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    const [member] = await db
      .select()
      .from(schema.orgMembers)
      .where(
        and(eq(schema.orgMembers.userId, userId), eq(schema.orgMembers.orgId, auth.org_id)),
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing the last admin
    if (member.role === "admin" && action === "deactivate") {
      const admins = await db
        .select({ id: schema.orgMembers.userId })
        .from(schema.orgMembers)
        .where(
          and(eq(schema.orgMembers.orgId, auth.org_id), eq(schema.orgMembers.role, "admin"), ne(schema.orgMembers.status, "deactivated")),
        );

      if (admins.length <= 1) {
        return NextResponse.json({ error: "Cannot deactivate the last organization admin" }, { status: 409 });
      }
    }

    switch (action) {
      case "deactivate":
        await db
          .update(schema.orgMembers)
          .set({ status: "deactivated" })
          .where(
            and(eq(schema.orgMembers.userId, userId), eq(schema.orgMembers.orgId, auth.org_id)),
          );
        await writeAudit({ action: "member.deactivate", actorUserId: auth.sub, orgId: auth.org_id, entityType: "org_member", entityId: userId });
        break;

      case "reactivate":
        await db
          .update(schema.orgMembers)
          .set({ status: "active" })
          .where(
            and(eq(schema.orgMembers.userId, userId), eq(schema.orgMembers.orgId, auth.org_id)),
          );
        await writeAudit({ action: "member.reactivate", actorUserId: auth.sub, orgId: auth.org_id, entityType: "org_member", entityId: userId });
        break;

      case "change_role": {
        const newRole = body.role;
        if (!newRole || !["student", "instructor", "admin"].includes(newRole)) {
          return NextResponse.json({ error: "Valid role required: student, instructor, or admin" }, { status: 400 });
        }
        if (member.role === "admin" && newRole !== "admin") {
          return NextResponse.json({ error: "Cannot demote the last admin. Promote another member first." }, { status: 409 });
        }
        await db
          .update(schema.orgMembers)
          .set({ role: newRole })
          .where(
            and(eq(schema.orgMembers.userId, userId), eq(schema.orgMembers.orgId, auth.org_id)),
          );
        await writeAudit({ action: "member.role_change", actorUserId: auth.sub, orgId: auth.org_id, entityType: "org_member", entityId: userId, metadata: { from: member.role, to: newRole } });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
