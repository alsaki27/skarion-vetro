import { describe, it, expect } from "vitest";
import { authorize } from "./capabilities";

describe("capability authorization", () => {
  it("student can list projects", () => {
    expect(authorize({ role: "student" }, "projects:list")).toBe(true);
  });

  it("student cannot approve data sources", () => {
    expect(authorize({ role: "student" }, "data-sources:approve")).toBe(false);
  });

  it("instructor can approve data sources", () => {
    expect(authorize({ role: "instructor" }, "data-sources:approve")).toBe(true);
  });

  it("admin can manage members", () => {
    expect(authorize({ role: "admin" }, "members:invite")).toBe(true);
  });

  it("platform staff has all capabilities", () => {
    expect(authorize({ role: "student", is_platform_staff: true }, "admin:manage")).toBe(true);
  });
});
