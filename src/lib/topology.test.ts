import { describe, it, expect } from "vitest";
import { traceUpstream, validateTopology, type TopologyNode } from "./topology";

describe("topology trace", () => {
  const nodes: TopologyNode[] = [
    { id: "premise1", type: "premise", parentId: "mst1" },
    { id: "mst1", type: "mst", parentId: "closure1" },
    { id: "closure1", type: "closure", parentId: "fdh1" },
    { id: "fdh1", type: "fdh" },
  ];

  it("traces premise to FDH", () => {
    const path = traceUpstream(nodes, "premise1");
    expect(path).toEqual(["premise1", "mst1", "closure1", "fdh1"]);
  });

  it("detects cycle", () => {
    const cyclic: TopologyNode[] = [
      { id: "a", type: "mst", parentId: "b" },
      { id: "b", type: "closure", parentId: "a" },
    ];
    const path = traceUpstream(cyclic, "a");
    expect(path).toEqual(["a", "b"]);
  });
});

describe("topology validation", () => {
  it("detects orphan nodes", () => {
    const nodes: TopologyNode[] = [
      { id: "premise1", type: "premise", parentId: "mst1" },
      { id: "mst1", type: "mst", parentId: "nonexistent" },
    ];
    const issues = validateTopology(nodes);
    expect(issues.some((i) => i.includes("Orphan"))).toBe(true);
  });

  it("detects unconnected premises", () => {
    const nodes: TopologyNode[] = [
      { id: "premise1", type: "premise" },
      { id: "fdh1", type: "fdh" },
    ];
    const issues = validateTopology(nodes);
    expect(issues.some((i) => i.includes("upstream"))).toBe(true);
  });
});
