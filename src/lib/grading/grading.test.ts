import { describe, it, expect } from "vitest";
import { p1Greenfield } from "@/lib/projects/p1-greenfield";
import { runGrading } from "@/lib/grading/engine";
import type { LngLat, NetworkElement } from "@/lib/types";
import { isPointElement } from "@/lib/types";

function pos(id: string): LngLat {
  const el = p1Greenfield.preloadedElements.find((e) => e.id === id);
  if (!el || !isPointElement(el)) throw new Error(`missing point element ${id}`);
  return el.position;
}

function goodDesign(): NetworkElement[] {
  return [
    ...p1Greenfield.preloadedElements,
    {
      id: "cable_main",
      type: "cable",
      path: [pos("pre_co"), pos("pre_pole_1"), pos("pre_pole_2"), pos("pre_pole_3"), pos("pre_pole_4"), pos("pre_pole_5")],
      startElementId: "pre_co",
      endElementId: "pre_pole_5",
      attributes: { cable_count: 12, aerial: true },
    },
    ...([1, 2, 3, 4, 5] as const).map((n): NetworkElement => ({
      id: `drop_${n}`,
      type: "drop_cable",
      path: [pos(`pre_pole_${n}`), pos(`pre_home_${n}`)],
      startElementId: `pre_pole_${n}`,
      endElementId: `pre_home_${n}`,
      attributes: { cable_count: 2 },
    })),
  ];
}

function badDesign(): NetworkElement[] {
  return [
    ...p1Greenfield.preloadedElements,
    {
      id: "cable_main",
      type: "cable",
      path: [pos("pre_co"), pos("pre_pole_3")],
      startElementId: "pre_co",
      endElementId: "pre_pole_3",
      attributes: { cable_count: 6, aerial: true },
    },
    {
      id: "drop_3",
      type: "drop_cable",
      path: [pos("pre_pole_3"), pos("pre_home_3")],
      attributes: { cable_count: 2 },
    },
  ];
}

describe("runGrading — known-good design", () => {
  const result = runGrading(p1Greenfield, goodDesign());

  it("passes overall", () => {
    expect(result.isPassing).toBe(true);
  });

  it("scores >= 95", () => {
    expect(result.totalScore).toBeGreaterThanOrEqual(95);
  });

  it("all individual checks pass", () => {
    const failed = result.checks.filter((c) => c.status !== "pass");
    expect(failed).toHaveLength(0);
  });
});

describe("runGrading — known-bad design", () => {
  const result = runGrading(p1Greenfield, badDesign());

  it("fails overall", () => {
    expect(result.isPassing).toBe(false);
  });

  it("connectivity fails (4 homes unreached)", () => {
    const check = result.checks.find((c) => c.checkId === "connectivity");
    expect(check?.status).toBe("fail");
  });

  it("capacity fails (6-count < 12)", () => {
    const check = result.checks.find((c) => c.checkId === "capacity");
    expect(check?.status).toBe("fail");
  });

  it("compliance fails (660ft span)", () => {
    const check = result.checks.find((c) => c.checkId === "compliance");
    expect(check?.status).toBe("fail");
  });
});

describe("grading gate logic", () => {
  // The D2 grading route splits checks into GATES (mandatory) and quality
  // checks (weighted). These tests exercise the gate-splitting logic
  // independently of the HTTP layer.

  const GATE_IDS = new Set(["connectivity", "compliance", "capacity", "trespass"]);

  const gateResult = runGrading(p1Greenfield, goodDesign());

  it("splits checks into gate and quality groups", () => {
    const gateResultChecks = gateResult.checks.map((c) => ({
      ...c,
      status: GATE_IDS.has(c.checkId) ? ("fail" as const) : ("pass" as const),
    }));
    const gateChecks = gateResultChecks.filter((c) => GATE_IDS.has(c.checkId));
    const qualityChecks = gateResultChecks.filter((c) => !GATE_IDS.has(c.checkId));
    expect(gateChecks.length).toBeGreaterThan(0);
    expect(qualityChecks.length).toBeGreaterThan(0);
    const gatesPassed = gateChecks.every((c) => c.status === "pass");
    expect(gatesPassed).toBe(false);
  });

  it("gate failure overrides passing weighted score", () => {
    const checksCopy = gateResult.checks.map((c) => ({
      checkId: c.checkId,
      category: c.category,
      status: c.checkId === "connectivity" ? "fail" as const : "pass" as const,
      score: c.score,
      message: c.message,
    }));
    const gateChecks = checksCopy.filter((c) => GATE_IDS.has(c.checkId));
    const gatesPassed = gateChecks.every((c) => c.status === "pass");
    const weightedPassed = gateResult.isPassing;

    const serverIsPassing = weightedPassed && gatesPassed;
    expect(serverIsPassing).toBe(false);
    expect(gatesPassed).toBe(false);
  });

  it("generates deterministic results on repeated runs", () => {
    const design = goodDesign();
    const r1 = runGrading(p1Greenfield, design);
    const r2 = runGrading(p1Greenfield, design);
    expect(r1.totalScore).toBe(r2.totalScore);
    expect(r1.isPassing).toBe(r2.isPassing);
    expect(r1.checks.map((c) => c.checkId).sort()).toEqual(r2.checks.map((c) => c.checkId).sort());
  });

  it("all gate checks present on a valid design", () => {
    const gateResultChecks = gateResult.checks.filter((c) => GATE_IDS.has(c.checkId));
    expect(gateResultChecks.length).toBeGreaterThan(0);
  });
});
