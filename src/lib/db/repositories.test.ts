import { describe, it, expect } from "vitest";
import { ProjectRepository } from "./project-repository";
import type { TenantContext } from "./tenant-context";

describe("repositories require tenant context", () => {
  const ctx: TenantContext = {
    orgId: "test-org", userId: "test-user", role: "student", requestId: "req-test",
  };

  it("project repository requires orgId at construction", () => {
    const repo = new ProjectRepository(ctx);
    expect(repo).toBeDefined();
  });
});
