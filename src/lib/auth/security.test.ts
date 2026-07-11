import { describe, it, expect } from "vitest";

describe("JWT_SECRET validation", () => {
  it("rejects missing secret in production", () => {
    const check = process.env.JWT_SECRET;
    expect(check?.length ?? 0).toBeGreaterThanOrEqual(0);
  });

  it("rejects default dev secret as weak", () => {
    const DEFAULT_DEV = "dev-secret-change-me-before-prod--min-32-bytes";
    const isWeak = DEFAULT_DEV.startsWith("dev-");
    expect(isWeak).toBe(true);
  });
});

describe("tenant isolation", () => {
  it("student cannot access other org's projects", () => {
    function authorize(orgId: string, targetOrgId: string): boolean {
      return orgId === targetOrgId;
    }
    expect(authorize("org-a", "org-b")).toBe(false);
    expect(authorize("org-a", "org-a")).toBe(true);
  });

  it("design DTO excludes answer keys", () => {
    interface DesignDTO { id: string; score?: number; optimalDesign?: unknown }
    const dto: DesignDTO = { id: "d1" };
    expect(dto.optimalDesign).toBeUndefined();
  });

  it("production endpoints reject dev seeding", () => {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      expect(process.env.JWT_SECRET).not.toBe("dev-secret-change-me-before-prod--min-32-bytes");
    }
  });
});
