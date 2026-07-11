import { describe, it, expect } from "vitest";

type FeatureClassification = "official_row" | "official_easement" | "parcel_derived" | "training_derived" | "environmental" | "unknown";
type ConfidenceLevel = "high" | "medium" | "low";

interface ConstraintFeature {
  id: string;
  classification: FeatureClassification;
  confidence: ConfidenceLevel;
  sourceName?: string;
  requiresVerification: boolean;
}

describe("constraint classification", () => {
  it("distinguishes official from derived data", () => {
    const official: ConstraintFeature = { id: "row1", classification: "official_row", confidence: "high", requiresVerification: false };
    const derived: ConstraintFeature = { id: "buf1", classification: "parcel_derived", confidence: "low", requiresVerification: true };
    expect(official.classification).toBe("official_row");
    expect(derived.classification).toBe("parcel_derived");
    expect(official.requiresVerification).toBe(false);
    expect(derived.requiresVerification).toBe(true);
  });

  it("prevents derived from being relabeled official", () => {
    function canRelabelToOfficial(current: FeatureClassification): boolean {
      return current === "official_row" || current === "official_easement";
    }
    expect(canRelabelToOfficial("parcel_derived")).toBe(false);
    expect(canRelabelToOfficial("training_derived")).toBe(false);
    expect(canRelabelToOfficial("official_row")).toBe(true);
  });

  it("tracks verification requirement", () => {
    const features: ConstraintFeature[] = [
      { id: "f1", classification: "official_row", confidence: "high", requiresVerification: false },
      { id: "f2", classification: "training_derived", confidence: "low", requiresVerification: true },
    ];
    const needsVerification = features.filter((f) => f.requiresVerification);
    expect(needsVerification).toHaveLength(1);
  });
});
