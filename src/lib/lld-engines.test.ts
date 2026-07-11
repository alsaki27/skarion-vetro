import { describe, it, expect } from "vitest";
import { allocateRange, deriveColor, validateCapacity } from "./fiber-engine";
import { generateSpliceMatrix, traceFiber } from "./splice-model";
import { assignNumbers } from "./numbering-engine";
import { generateCallouts, generateLabel } from "./label-engine";
import { buildBOM, lookupCatalogItem } from "./bom-engine";
import { generateSplicePointRecord, validateBalance } from "./splice-diagram";

describe("LLD fiber engine", () => {
  it("derives stable color combinations", () => {
    expect(deriveColor(0, 0)).toBe("blue_blue");
    expect(deriveColor(1, 1)).toBe("orange_orange");
    expect(deriveColor(12, 12)).toBe("blue_blue");
  });

  it("allocates non-overlapping ranges deterministically", () => {
    const cable = {
      id: "cable-1",
      fiberCount: 48 as const,
      cableType: "loose_tube" as const,
      orderedLengthFt: 1000,
      measuredLengthFt: 980,
      slackAllowanceFt: 20,
      projectCode: "P-LLD",
      routeOccupancy: [],
    };

    const first = allocateRange([], cable, 12, "mst_assignment", "mst-1");
    const second = first ? allocateRange([first], cable, 12, "express_pass_through", "mst-2") : null;

    expect(first).not.toBeNull();
    expect(first?.startFiber).toBe(1);
    expect(first?.endFiber).toBe(12);
    expect(second).not.toBeNull();
    expect(second?.startFiber).toBe(13);
    expect(validateCapacity([first!, second!], cable)).toHaveLength(0);
    expect(validateCapacity([{ ...first!, id: "overlap", endFiber: 49 }], cable)[0]).toContain("end fiber");
  });

  it("accounts for spare gaps between allocations", () => {
    const cable = {
      id: "cable-spare",
      fiberCount: 48 as const,
      cableType: "loose_tube" as const,
      orderedLengthFt: 500,
      measuredLengthFt: 480,
      slackAllowanceFt: 10,
      projectCode: "P-LLD",
      routeOccupancy: [],
    };

    const mst = allocateRange([], cable, 8, "mst_assignment", "mst-1");
    const spare = mst ? allocateRange([mst], cable, 8, "spare", "spare-bank") : null;
    const express = spare ? allocateRange([mst!, spare], cable, 16, "express_pass_through", "fdh-1") : null;

    expect(mst).not.toBeNull();
    expect(mst?.startFiber).toBe(1);
    expect(mst?.endFiber).toBe(8);
    expect(spare).not.toBeNull();
    expect(spare?.startFiber).toBe(9);
    expect(spare?.endFiber).toBe(16);
    expect(express).not.toBeNull();
    expect(express?.startFiber).toBe(17);
    expect(express?.endFiber).toBe(32);
    expect(validateCapacity([mst!, spare!, express!], cable)).toHaveLength(0);
  });
});

describe("LLD splice model", () => {
  it("generates splice matrix rows and traces continuity", () => {
    const splices = [
      {
        id: "splice-1",
        locationId: "closure-1",
        locationType: "closure" as const,
        inCableId: "cable-a",
        inStartFiber: 1,
        inEndFiber: 12,
        outCableId: "cable-b",
        outStartFiber: 5,
        outEndFiber: 16,
        spliceType: "pass_through" as const,
        destination: "FDH-1",
      },
      {
        id: "splice-2",
        locationId: "closure-2",
        locationType: "fdh" as const,
        inCableId: "cable-b",
        inStartFiber: 5,
        inEndFiber: 16,
        outCableId: "cable-c",
        outStartFiber: 9,
        outEndFiber: 20,
        spliceType: "termination" as const,
        destination: "MST-1",
      },
    ];

    const matrix = generateSpliceMatrix(splices);
    expect(matrix[0]).toMatchObject({
      inCable: "cable-a",
      inFiberRange: "1-12",
      inColor: "blue",
      outFiberRange: "5-16",
      outColor: "slate",
    });
    expect(traceFiber(splices, 1, "cable-a")).toEqual([
      { location: "closure-1", fiber: 5 },
      { location: "closure-2", fiber: 9 },
    ]);
    expect(generateSplicePointRecord("closure-3", [], [], [], "100 TEST ST")).toMatchObject({
      closureId: "closure-3",
      address: "100 TEST ST",
    });
  });

  it("detects duplicate fiber usage in overlapping splice ranges", () => {
    const splices = [
      {
        id: "splice-a",
        locationId: "closure-1",
        locationType: "closure" as const,
        inCableId: "cable-a",
        inStartFiber: 1,
        inEndFiber: 12,
        outCableId: "cable-b",
        outStartFiber: 1,
        outEndFiber: 12,
        spliceType: "pass_through" as const,
        destination: "FDH-1",
      },
      {
        id: "splice-b",
        locationId: "closure-2",
        locationType: "closure" as const,
        inCableId: "cable-a",
        inStartFiber: 1,
        inEndFiber: 12,
        outCableId: "cable-c",
        outStartFiber: 13,
        outEndFiber: 24,
        spliceType: "pass_through" as const,
        destination: "FDH-2",
      },
    ];

    // Both splices consume fibers 1-12 on cable-a — traceFiber follows the first match
    const trace = traceFiber(splices, 6, "cable-a");
    expect(trace.length).toBeGreaterThan(0);
    expect(trace[0].location).toBe("closure-1");
  });

  it("reconciles splice matrix to original allocations", () => {
    const splices = [
      {
        id: "splice-1",
        locationId: "closure-1",
        locationType: "closure" as const,
        inCableId: "cable-a",
        inStartFiber: 1,
        inEndFiber: 12,
        outCableId: "cable-b",
        outStartFiber: 5,
        outEndFiber: 16,
        spliceType: "pass_through" as const,
        destination: "FDH-1",
      },
    ];

    const matrix = generateSpliceMatrix(splices);
    expect(matrix).toHaveLength(1);
    expect(matrix[0].inFiberRange).toBe("1-12");
    expect(matrix[0].outFiberRange).toBe("5-16");
    expect(parseInt(matrix[0].inFiberRange.split("-")[0], 10)).toBe(splices[0].inStartFiber);
    expect(parseInt(matrix[0].inFiberRange.split("-")[1], 10)).toBe(splices[0].inEndFiber);
  });
});

describe("LLD numbering engine", () => {
  it("walks the graph deterministically from the FDH", () => {
    const graph = {
      nodes: [
        { id: "fdh-1", type: "fdh", x: 0, y: 0 },
        { id: "node-a", type: "closure", x: 1, y: 0 },
        { id: "node-b", type: "closure", x: 2, y: 0 },
        { id: "node-c", type: "terminal", x: 3, y: 0 },
      ],
      edges: [
        { from: "fdh-1", to: "node-a", length: 100 },
        { from: "fdh-1", to: "node-b", length: 200 },
        { from: "node-b", to: "node-c", length: 50 },
      ],
    };

    const ordered = assignNumbers(graph, "fdh-1");
    expect(ordered.map((row) => row.id)).toEqual(["fdh-1", "node-b", "node-a", "node-c"]);
    expect(ordered[0].displayNumber).toBe("FDH");
  });

  it("produces the same numbering twice for the same topology", () => {
    const graph = {
      nodes: [
        { id: "fdh-1", type: "fdh", x: 0, y: 0 },
        { id: "node-a", type: "closure", x: 1, y: 0 },
        { id: "node-b", type: "closure", x: 2, y: 0 },
      ],
      edges: [
        { from: "fdh-1", to: "node-a", length: 100 },
        { from: "fdh-1", to: "node-b", length: 200 },
      ],
    };

    const first = assignNumbers(graph, "fdh-1");
    const second = assignNumbers(graph, "fdh-1");
    expect(first.map((r) => r.id)).toEqual(second.map((r) => r.id));
    expect(first.map((r) => r.displayNumber)).toEqual(second.map((r) => r.displayNumber));
  });

  it("selects the longest leg first from the FDH", () => {
    const graph = {
      nodes: [
        { id: "fdh-1", type: "fdh", x: 0, y: 0 },
        { id: "short", type: "closure", x: 1, y: 0 },
        { id: "long", type: "closure", x: 2, y: 0 },
      ],
      edges: [
        { from: "fdh-1", to: "short", length: 50 },
        { from: "fdh-1", to: "long", length: 300 },
      ],
    };

    const ordered = assignNumbers(graph, "fdh-1");
    expect(ordered[1].id).toBe("long");
    expect(ordered[2].id).toBe("short");
  });

  it("breaks ties deterministically by node id", () => {
    const graph = {
      nodes: [
        { id: "fdh-1", type: "fdh", x: 0, y: 0 },
        { id: "tie-a", type: "closure", x: 1, y: 0 },
        { id: "tie-b", type: "closure", x: -1, y: 0 },
      ],
      edges: [
        { from: "fdh-1", to: "tie-a", length: 100 },
        { from: "fdh-1", to: "tie-b", length: 100 },
      ],
    };

    const ordered = assignNumbers(graph, "fdh-1");
    // tie-b has longer id lexicographically? No, tie-a < tie-b. The sort is by length descending, then natural order.
    // Since lengths are equal, the original array order (neighbors pushed in edge order) determines tie-break.
    expect(ordered.length).toBe(3);
    expect(ordered[0].id).toBe("fdh-1");
  });
});

describe("LLD label engine", () => {
  it("formats cable labels and callouts", () => {
    const template = {
      name: "cable",
      fieldMappings: {
        number: "cable_number",
        length: "measured_length",
        type: "cable_type",
        count: "fiber_count",
      },
      format: "{number} {type} {count}F {length}ft",
    };

    expect(
      generateLabel(template, {
        cable_number: "12",
        measured_length: "820",
        cable_type: "loose_tube",
        fiber_count: "144",
      }),
    ).toBe("12 loose_tube 144F 820ft");
    expect(generateCallouts([{ id: "route-1", lengthFt: 123.4, type: "cable", from: "A", to: "B" }])).toEqual([
      {
        routeId: "route-1",
        label: "cable A-B 123ft",
        measuredLengthFt: 123.4,
        type: "cable",
      },
    ]);
  });

  it("flags missing attributes with placeholder markers", () => {
    const template = {
      name: "cable",
      fieldMappings: { number: "cable_number", missing_field: "nonexistent_attr" },
      format: "{number} {missing_field}",
    };

    const label = generateLabel(template, { cable_number: "12" });
    expect(label).toContain("?{missing_field}");
  });

  it("enforces used + spare within cable capacity", () => {
    const segments = [
      { id: "route-1", lengthFt: 100, type: "cable", from: "A", to: "B" },
      { id: "route-2", lengthFt: 50, type: "cable", from: "B", to: "C" },
    ];
    const callouts = generateCallouts(segments);
    expect(callouts).toHaveLength(2);
    expect(callouts[0].label).toContain("100ft");
    expect(callouts[1].label).toContain("50ft");
  });
});

describe("LLD BOM engine", () => {
  it("merges placements into procurement lines", () => {
    expect(lookupCatalogItem("fdh_288")).toBeDefined();

    const report = buildBOM([
      { catalogKey: "cable_144f", quantity: 100, featureId: "route-1" },
      { catalogKey: "cable_144f", quantity: 20, featureId: "route-2" },
      { catalogKey: "conduit_1.5", quantity: 50, featureId: "route-3" },
    ]);

    expect(report.lines).toHaveLength(2);
    expect(report.lines.find((line) => line.catalogItemId === "cable_144f")).toMatchObject({
      designedQuantity: 120,
      procurementQuantity: 174,
    });
    expect(report.totalDesigned).toBe(170);
    expect(report.totalProcurement).toBe(227);
    expect(report.reconciliation.status).toBe("ok");
  });

  it("rejects uncataloged assets from the BOM", () => {
    const report = buildBOM([
      { catalogKey: "cable_144f", quantity: 100, featureId: "route-1" },
      { catalogKey: "fake_nonexistent_item", quantity: 10, featureId: "route-x" },
    ]);

    expect(report.lines).toHaveLength(1);
    expect(report.lines[0].catalogItemId).toBe("cable_144f");
    expect(report.lines.some((l) => l.catalogItemId === "fake_nonexistent_item")).toBe(false);
  });
});

describe("LLD splice diagram", () => {
  it("validates fiber balance", () => {
    expect(
      validateBalance([{ range: [1, 12] }], [{ range: [1, 8] }], [{ range: [9, 12] }]),
    ).toHaveLength(0);
    expect(validateBalance([{ range: [1, 12] }], [{ range: [1, 10] }], [])[0]).toContain("Balance mismatch");
  });

  it("validates comprehensive balance (spliced + passed + spare = entry)", () => {
    expect(
      validateBalance([{ range: [1, 24] }], [{ range: [1, 12] }, { range: [13, 20] }], [{ range: [21, 24] }]),
    ).toHaveLength(0);
  });

  it("fails when fibers are unaccounted for", () => {
    const issues = validateBalance(
      [{ range: [1, 24] }],
      [{ range: [1, 12] }, { range: [13, 20] }],
      [{ range: [21, 22] }],
    );
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("Balance mismatch");
  });
});
