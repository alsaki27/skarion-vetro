import { describe, it, expect } from "vitest";
import { getRulesForStage, validateWithSourceAvailability } from "./constructability";

describe("constructability validation", () => {
  it("returns rules for a stage", () => {
    const routes = getRulesForStage("routes");
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.every((r) => r.stage === "routes")).toBe(true);
  });

  it("returns not_evaluated when source missing", () => {
    const rules = getRulesForStage("routes");
    const results = validateWithSourceAvailability(rules, new Set());
    const notEval = results.filter((r) => r.severity === "not_evaluated");
    expect(notEval.length).toBeGreaterThan(0);
  });

  it("passes when source is available", () => {
    const rules = getRulesForStage("routes");
    const results = validateWithSourceAvailability(rules, new Set(["roads", "parcels", "row", "environmental"]));
    expect(results.every((r) => r.severity === "pass")).toBe(true);
  });
});
