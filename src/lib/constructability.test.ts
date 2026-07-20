import { describe, it, expect } from "vitest";
import { runConstructability } from "./constructability";
import type { NetworkElement } from "@/lib/types";

function makeDrop(label: string, lengthFt: number): NetworkElement {
  const path: [number, number][] = [[0, 0]];
  for (let i = 1; i <= 10; i++) {
    const stepDeg = (lengthFt / 364000) / 10;
    path.push([stepDeg * i, 0]);
  }
  return {
    id: `drop_${label}`,
    type: "drop_cable",
    label,
    path,
    startElementId: "a",
    endElementId: "b",
  } as unknown as NetworkElement;
}

function makeCable(label: string, lengthFt: number): NetworkElement {
  const path: [number, number][] = [[0, 0]];
  for (let i = 1; i <= 10; i++) {
    const stepDeg = (lengthFt / 364000) / 10;
    path.push([stepDeg * i, 0]);
  }
  return {
    id: `cable_${label}`,
    type: "cable",
    label,
    path,
    startElementId: "a",
    endElementId: "b",
  } as unknown as NetworkElement;
}

describe("constructability rules", () => {
  it("detects drop cables exceeding 150ft", () => {
    const elements = [makeDrop("short", 100), makeDrop("long", 200)];
    const { issues } = runConstructability(elements, new Set());
    const maxDropIssues = issues.filter((i) => i.ruleId === "max_routed_drop");
    expect(maxDropIssues.length).toBe(1);
    expect(maxDropIssues[0].elementIds).toContain("drop_long");
    expect(maxDropIssues[0].message).toContain("ft (max 150ft)");
  });

  it("detects cable spans exceeding 300ft", () => {
    const elements = [makeCable("short", 200), makeCable("long", 400)];
    const { issues } = runConstructability(elements, new Set());
    const spanIssues = issues.filter((i) => i.ruleId === "max_pole_span");
    expect(spanIssues.length).toBe(1);
    expect(spanIssues[0].elementIds).toContain("cable_long");
    expect(spanIssues[0].message).toContain("ft (max 300ft)");
  });

  it("marks rules as not evaluated when source unavailable", () => {
    const { notEvaluated } = runConstructability([], new Set());
    expect(notEvaluated).toContain("trespass_check");
  });

  it("evaluates trespass when parcels available", () => {
    const point = makeDrop("inside", 50);
    (point as unknown as Record<string, unknown>).position = [0, 0];
    (point as unknown as Record<string, unknown>).type = "pole";
    const elements = [point];
    const parcels: GeoJSON.Feature[] = [];
    const { notEvaluated } = runConstructability(elements, new Set(["parcels"]), { parcels });
    expect(notEvaluated).not.toContain("trespass_check");
  });

  it("detects orphan structures not connected to any cable", () => {
    const orphan = {
      id: "orphan_pole",
      type: "pole",
      label: "Orphan Pole",
      position: [0, 0],
    } as unknown as NetworkElement;
    const connected = {
      id: "connected_pole",
      type: "pole",
      label: "Connected Pole",
      position: [1, 1],
    } as unknown as NetworkElement;
    const cable = {
      id: "cable1",
      type: "cable",
      path: [[0, 0], [1, 1]],
      startElementId: "connected_pole",
      endElementId: "other",
    } as unknown as NetworkElement;
    const elements = [orphan, connected, cable];
    const { issues } = runConstructability(elements, new Set());
    const orphanIssues = issues.filter((i) => i.ruleId === "orphan_structure");
    expect(orphanIssues.length).toBe(1);
    expect(orphanIssues[0].elementIds).toContain("orphan_pole");
  });
});
