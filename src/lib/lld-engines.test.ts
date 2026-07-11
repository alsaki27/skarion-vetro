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
});

describe("LLD splice diagram", () => {
  it("validates fiber balance", () => {
    expect(
      validateBalance([{ range: [1, 12] }], [{ range: [1, 8] }], [{ range: [9, 12] }]),
    ).toHaveLength(0);
    expect(validateBalance([{ range: [1, 12] }], [{ range: [1, 10] }], [])[0]).toContain("Balance mismatch");
  });
});
