import { describe, it, expect, beforeEach } from "vitest";
import { useDesignStore } from "./store";

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
