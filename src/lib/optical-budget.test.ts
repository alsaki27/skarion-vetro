import { describe, it, expect } from "vitest";
import { calculateOpticalBudget, findWorstPath, type OpticalPath } from "./optical-budget";

const simplePath: OpticalPath = {
  id: "p1",
  label: "CO to Premise A",
  segments: [
    { type: "connector", label: "CO bulkhead", count: 1 },
    { type: "fiber", label: "Feeder cable", lengthFt: 5000 },
    { type: "splice", label: "FDH splice", count: 1 },
    { type: "splitter", label: "1x32 splitter", splitterRatio: 32 },
    { type: "fiber", label: "Distribution cable", lengthFt: 1000 },
    { type: "connector", label: "Premise ONT", count: 1 },
  ],
};

describe("optical budget", () => {
  it("calculates budget for a simple path", () => {
    const budget = calculateOpticalBudget(simplePath, 1550);
    expect(budget.segments.length).toBe(6);
    expect(budget.totalLossDb).toBeGreaterThan(0);
    expect(budget.passes).toBeDefined();
    expect(budget.wavelengthNm).toBe(1550);
  });

  it("segment order produces cumulative loss", () => {
    const budget = calculateOpticalBudget(simplePath, 1550);
    for (let i = 1; i < budget.segments.length; i++) {
      expect(budget.segments[i].cumulativeDb).toBeGreaterThanOrEqual(budget.segments[i - 1].cumulativeDb);
    }
  });

  it("splitter contributes approximately 3*log10(ratio) dB loss", () => {
    const path: OpticalPath = {
      id: "p2",
      label: "Splitter only",
      segments: [{ type: "splitter", label: "1x16", splitterRatio: 16 }],
    };
    const budget = calculateOpticalBudget(path, 1550);
    // 10*log10(16) ≈ 12.04
    expect(budget.segments[0].lossDb).toBeGreaterThan(11);
    expect(budget.segments[0].lossDb).toBeLessThan(13);
  });

  it("reports warnings for splitter without ratio", () => {
    const path: OpticalPath = {
      id: "p3",
      label: "Bad splitter",
      segments: [{ type: "splitter", label: "No ratio" }],
    };
    const budget = calculateOpticalBudget(path, 1550);
    expect(budget.warnings.length).toBeGreaterThan(0);
  });

  it("finds worst path from multiple paths", () => {
    const paths = [simplePath];
    const worst = findWorstPath(paths, 1550);
    expect(worst).toBeDefined();
    expect(worst!.pathId).toBe(simplePath.id);
  });

  it("applies engineering margin to total loss", () => {
    const path: OpticalPath = {
      id: "p4",
      label: "Empty",
      segments: [],
    };
    const budget = calculateOpticalBudget(path, 1550);
    expect(budget.totalLossDb).toBe(3.0); // engineering margin only
    expect(budget.marginDb).toBe(3.0);
  });
});
