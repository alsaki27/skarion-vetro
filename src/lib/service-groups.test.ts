import { describe, it, expect } from "vitest";
import { createServiceGroup, assignPremiseToGroup, validateServiceGroups } from "./service-groups";

describe("service groups (HLD 02)", () => {
  it("creates service group with capacity", () => {
    const g = createServiceGroup("mst1", 6);
    expect(g.capacity).toBe(6);
    expect(g.sparePorts).toBe(6);
  });

  it("assigns premises", () => {
    let g = createServiceGroup("mst1", 4);
    g = assignPremiseToGroup(g, "p1");
    g = assignPremiseToGroup(g, "p2");
    expect(g.premiseIds).toHaveLength(2);
    expect(g.sparePorts).toBe(2);
  });

  it("prevents over-assignment", () => {
    let g = createServiceGroup("mst1", 1);
    g = assignPremiseToGroup(g, "p1");
    g = assignPremiseToGroup(g, "p2");
    expect(g.premiseIds).toHaveLength(1);
  });

  it("detects unassigned premises", () => {
    const g = createServiceGroup("mst1", 6);
    const issues = validateServiceGroups([g], ["p1", "p2"]);
    expect(issues.length).toBeGreaterThan(0);
  });
});
