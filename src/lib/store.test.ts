import { describe, it, expect, beforeEach } from "vitest";
import { useDesignStore } from "./store";
import { runGrading } from "./grading/engine";
import { p10ParksideGeorgetown } from "./projects/p10-parkside-georgetown";

describe("service group store", () => {
  beforeEach(() => {
    useDesignStore.setState({ serviceGroups: {} });
  });

  it("creates a service group and returns its id", () => {
    const id = useDesignStore.getState().createServiceGroup("Group 1", ["p1", "p2", "p3"], "#22c55e");
    expect(id).toBeTruthy();
    const groups = useDesignStore.getState().serviceGroups;
    expect(Object.keys(groups)).toHaveLength(1);
    expect(groups[id].name).toBe("Group 1");
    expect(groups[id].premiseIds).toEqual(["p1", "p2", "p3"]);
    expect(groups[id].color).toBe("#22c55e");
    expect(groups[id].mstSize).toBe(6);
  });

  it("sets MST size on a group", () => {
    const id = useDesignStore.getState().createServiceGroup("G1", ["p1"], "#ff0000");
    useDesignStore.getState().setGroupMstSize(id, 8);
    expect(useDesignStore.getState().serviceGroups[id].mstSize).toBe(8);
  });

  it("deletes a service group", () => {
    const id = useDesignStore.getState().createServiceGroup("G1", ["p1"], "#ff0000");
    expect(Object.keys(useDesignStore.getState().serviceGroups)).toHaveLength(1);
    useDesignStore.getState().deleteServiceGroup(id);
    expect(Object.keys(useDesignStore.getState().serviceGroups)).toHaveLength(0);
  });

  it("returns 6-port MST as default size", () => {
    const id = useDesignStore.getState().createServiceGroup("G1", ["p1"], "#ff0000");
    expect(useDesignStore.getState().serviceGroups[id].mstSize).toBe(6);
  });
});

describe("service group multi-select and checks", () => {
  beforeEach(() => {
    useDesignStore.setState({ serviceGroups: {}, selectedIds: new Set(), selectedId: null, elements: {} });
  });

  it("toggleSelection adds/removes ids correctly", () => {
    useDesignStore.getState().toggleSelection("p1");
    expect(useDesignStore.getState().selectedIds.has("p1")).toBe(true);
    useDesignStore.getState().toggleSelection("p1");
    expect(useDesignStore.getState().selectedIds.has("p1")).toBe(false);
  });

  it("group creation only includes eligible premises", () => {
    useDesignStore.setState({
      elements: {
        p1: { id: "p1", type: "premise", locked: true, position: [0, 0], label: "P1", attributes: { serviceable: true } } as unknown as ReturnType<typeof useDesignStore.getState>["elements"][string],
        p2: { id: "p2", type: "premise", locked: true, position: [0, 0], label: "P2", attributes: { serviceable: true } } as unknown as ReturnType<typeof useDesignStore.getState>["elements"][string],
        p3: { id: "p3", type: "premise", locked: true, position: [0, 0], label: "P3", attributes: { serviceable: false } } as unknown as ReturnType<typeof useDesignStore.getState>["elements"][string],
      },
    });
    const gid = useDesignStore.getState().createServiceGroup("G1", ["p1"], "#ff0");
    // Select p1 (already in group), p2 (eligible), p3 (not serviceable)
    useDesignStore.setState({ selectedIds: new Set(["p1", "p2", "p3"]) });
    expect(useDesignStore.getState().serviceGroups[gid].premiseIds).toEqual(["p1"]);
  });

  it("unassigned_premise check fires with partial grouping", () => {
    const premises = [
      { id: "prem_1", type: "premise" as const, locked: true, position: [0, 0] as [number, number], label: "1", attributes: {} },
      { id: "prem_2", type: "premise" as const, locked: true, position: [0, 0] as [number, number], label: "2", attributes: {} },
    ];
    const groups = { g1: { id: "g1", premiseIds: ["prem_1"] } };
    // Only test premises — prem_2 is unassigned
    const result = runGrading(p10ParksideGeorgetown, premises, null, groups);
    const check = result.checks.find((c) => c.checkId === "unassigned_premise");
    expect(check).toBeDefined();
    expect(check!.status).toBe("fail");
  });

  it("unassigned_premise clears when all premises assigned", () => {
    const premises = [
      { id: "prem_a", type: "premise" as const, locked: true, position: [0, 0] as [number, number], label: "A", attributes: {} },
      { id: "prem_b", type: "premise" as const, locked: true, position: [0, 0] as [number, number], label: "B", attributes: {} },
    ];
    const groups = { g1: { id: "g1", premiseIds: ["prem_a"] }, g2: { id: "g2", premiseIds: ["prem_b"] } };
    // Only run on the test premises, not the full fixture's 91 premises
    const result = runGrading(p10ParksideGeorgetown, premises, null, groups);
    const check = result.checks.find((c) => c.checkId === "unassigned_premise");
    expect(check!.status).toBe("pass");
  });
});
