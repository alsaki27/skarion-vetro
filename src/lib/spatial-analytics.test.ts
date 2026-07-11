import { describe, it, expect } from "vitest";
import { calculateRouteMetrics } from "./spatial-analytics";
import { checkLaunchReadiness as checkGate } from "./launch-gate";

describe("spatial analytics", () => {
  it("calculates route metrics", () => {
    const features = [
      { type: "conduit", length: 500 },
      { type: "conduit", length: 300 },
      { type: "cable", length: 800 },
    ];
    const metrics = calculateRouteMetrics(features);
    const conduitMetric = metrics.find((m) => m.type === "conduit");
    expect(conduitMetric?.count).toBe(2);
    expect(conduitMetric?.totalLengthFt).toBe(800);
  });
});

describe("launch gate" , () => {
  it("launch gate detects issues", () => {
    const result = checkGate();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});
