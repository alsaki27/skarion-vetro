// Centralized capability authorization system.
// Every protected operation must pass `authorize()` before executing.

export type Role = "student" | "instructor" | "admin" | "platform_staff";

export type Capability =
  | "projects:list"
  | "projects:read"
  | "projects:create"
  | "projects:update"
  | "projects:delete"
  | "projects:publish"
  | "projects:grade"
  | "designs:create"
  | "designs:read"
  | "designs:update"
  | "designs:delete"
  | "designs:read_any"
  | "designs:grade"
  | "layers:list"
  | "layers:read"
  | "layers:create"
  | "layers:update"
  | "layers:delete"
  | "data-sources:list"
  | "data-sources:read"
  | "data-sources:create"
  | "data-sources:approve"
  | "data-sources:delete"
  | "assignments:list"
  | "assignments:create"
  | "assignments:grade"
  | "reviews:create"
  | "reviews:read"
  | "reviews:update"
  | "exports:create"
  | "members:list"
  | "members:invite"
  | "members:update"
  | "members:remove"
  | "audit:read"
  | "admin:manage";

interface AuthSubject {
  sub: string;
  org_id: string;
  role: Role;
  is_platform_staff?: boolean;
}

/**
 * Returns the effective capabilities for a given role.
 * Platform staff inherit all capabilities.
 */
export function getCapabilities(role: Role): Set<Capability> {
  // Base capabilities that all authenticated users share
  const base: Capability[] = [
    "projects:list",
    "projects:read",
    "designs:create",
    "designs:read",
    "designs:update",
    "layers:list",
    "layers:read",
    "data-sources:list",
    "data-sources:read",
  ];

  const student: Capability[] = [...base];

  const instructor: Capability[] = [
    ...student,
    "projects:publish",
    "projects:grade",
    "designs:read_any",
    "designs:grade",
    "layers:create",
    "layers:update",
    "layers:delete",
    "data-sources:create",
    "data-sources:approve",
    "assignments:list",
    "assignments:create",
    "assignments:grade",
    "reviews:create",
    "reviews:read",
    "reviews:update",
    "exports:create",
  ];

  const admin: Capability[] = [
    ...instructor,
    "projects:create",
    "projects:update",
    "projects:delete",
    "data-sources:delete",
    "members:list",
    "members:invite",
    "members:update",
    "members:remove",
    "audit:read",
    "designs:delete",
    "admin:manage",
  ];

  const map: Record<Role, Capability[]> = {
    student,
    instructor,
    admin,
    platform_staff: [...admin],
  };

  return new Set(map[role] ?? student);
}

// Cache capability sets per role
const capabilityCache = new Map<string, Set<Capability>>();
function getCachedCapabilities(role: Role): Set<Capability> {
  const key = role;
  if (!capabilityCache.has(key)) {
    capabilityCache.set(key, getCapabilities(role));
  }
  return capabilityCache.get(key)!;
}

/**
 * Authorize an action against a subject's role.
 * Returns true if the subject has the required capability.
 */
export function authorize(
  subject: { role: Role; is_platform_staff?: boolean },
  capability: Capability,
  _resource?: Record<string, unknown>,
): boolean {
  void _resource;
  if (subject.is_platform_staff) return true;
  const effectiveRole: Role = subject.role === "platform_staff" ? "platform_staff" : subject.role === "admin" ? "admin" : subject.role === "instructor" ? "instructor" : "student";
  return getCachedCapabilities(effectiveRole).has(capability);
}

/**
 * Authorize that the subject owns or has access to a specific resource.
 * For students, this checks resource ownership (e.g., own design).
 */
export function authorizeResource(
  subject: AuthSubject,
  resourceOwnerId: string | undefined,
  capability: Capability,
): boolean {
  if (subject.is_platform_staff) return true;
  // Students can only access their own resources
  if (subject.role === "student") {
    return resourceOwnerId === subject.sub;
  }
  // Instructors/admins need the base capability
  return authorize(subject, capability);
}
