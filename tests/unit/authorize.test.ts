import { describe, it, expect } from "vitest";
import { authorize, assertRole } from "@/lib/authorize";
import { ForbiddenError } from "@/lib/errors";

function ctx(role: "student" | "instructor" | "admin", isPlatformStaff = false, orgId = "org-1") {
  return { userId: "user-1", orgId, role, isPlatformStaff };
}

describe("authorize", () => {
  it("allows students to edit own designs", () => {
    expect(() => authorize(ctx("student"), "design.edit_own", { ownerId: "user-1" })).not.toThrow();
  });

  it("denies students from editing other designs", () => {
    expect(() => authorize(ctx("student"), "design.edit_own", { ownerId: "user-2" })).toThrow(ForbiddenError);
  });

  it("denies students from inviting members", () => {
    expect(() => authorize(ctx("student"), "member.invite")).toThrow(ForbiddenError);
  });

  it("allows instructors to invite members", () => {
    expect(() => authorize(ctx("instructor"), "member.invite")).not.toThrow();
  });

  it("denies instructors from managing billing", () => {
    expect(() => authorize(ctx("instructor"), "billing.manage")).toThrow(ForbiddenError);
  });

  it("allows admins to manage billing", () => {
    expect(() => authorize(ctx("admin"), "billing.manage")).not.toThrow();
  });

  it("denies cross-org access", () => {
    expect(() => authorize(ctx("admin"), "audit.read", { orgId: "other-org" })).toThrow(ForbiddenError);
  });

  it("denies instructors from managing org settings", () => {
    expect(() => authorize(ctx("instructor"), "org.settings")).toThrow(ForbiddenError);
  });
});

describe("assertRole", () => {
  it("allows matching role", () => {
    expect(() => assertRole(ctx("admin"), "admin")).not.toThrow();
  });

  it("denies non-matching role", () => {
    expect(() => assertRole(ctx("student"), "admin", "instructor")).toThrow(ForbiddenError);
  });
});
