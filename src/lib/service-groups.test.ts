import { describe, it, expect } from "vitest";
import { createServiceGroup, assignPremiseToGroup, validateServiceGroups } from "./service-groups";

describe("service groups", () => {
  it("creates a service group with capacity", () => {
    const g = createServiceGroup("mst1", 6);
    expect(g.capacity).toBe(6);
    expect(g.sparePorts).toBe(6);
    expect(g.status).toBe("draft");
  });

  it("assigns a premise to a group", () => {
    let g = createServiceGroup("mst1", 4);
    g = assignPremiseToGroup(g, "p1");
    expect(g.premiseIds).toHaveLength(1);
    expect(g.sparePorts).toBe(3);
  });

  it("prevents assigning beyond capacity", () => {
    let g = createServiceGroup("mst1", 1);
    g = assignPremiseToGroup(g, "p1");
    g = assignPremiseToGroup(g, "p2");
    expect(g.premiseIds).toHaveLength(1);
  });

  it("detects unassigned premises", () => {
    const g = createServiceGroup("mst1", 6);
    const issues = validateServiceGroups([g], ["p1", "p2"]);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("Unassigned");
  });
});
