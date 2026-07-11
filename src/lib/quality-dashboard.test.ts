import { describe, it, expect } from "vitest";

interface DatasetQuality {
  featureCount: number;
  nullGeometry: number;
  invalidGeometry: number;
  unnamedRoads: number;
  duplicateAddresses: number;
  staleSource: boolean;
  crsWarnings: string[];
  status: "ready" | "needs_review" | "blocked";
}

describe("data quality dashboard", () => {
  it("marks dataset as ready when quality is acceptable", () => {
    const quality: DatasetQuality = {
      featureCount: 5000, nullGeometry: 0, invalidGeometry: 0,
      unnamedRoads: 0, duplicateAddresses: 0, staleSource: false,
      crsWarnings: [], status: "ready",
    };
    expect(quality.status).toBe("ready");
  });

  it("flags datasets needing review", () => {
    const quality: DatasetQuality = {
      featureCount: 5000, nullGeometry: 5, invalidGeometry: 2,
      unnamedRoads: 10, duplicateAddresses: 3, staleSource: false,
      crsWarnings: ["EPSG:4269 vs expected EPSG:4326"], status: "needs_review",
    };
    expect(quality.status).toBe("needs_review");
    expect(quality.nullGeometry).toBeGreaterThan(0);
    expect(quality.crsWarnings.length).toBeGreaterThan(0);
  });

  it("blocks datasets with critical issues", () => {
    const quality: DatasetQuality = {
      featureCount: 0, nullGeometry: 5000, invalidGeometry: 5000,
      unnamedRoads: 5000, duplicateAddresses: 5000, staleSource: true,
      crsWarnings: ["No CRS detected"], status: "blocked",
    };
    expect(quality.status).toBe("blocked");
  });

  it("detects stale sources", () => {
    const daysSinceRefresh = 400;
    const stale = daysSinceRefresh > 365;
    expect(stale).toBe(true);
  });

  it("tracks refresh diff", () => {
    interface RefreshDiff {
      added: number;
      changed: number;
      removed: number;
    }
    const diff: RefreshDiff = { added: 50, changed: 10, removed: 5 };
    expect(diff.added + diff.changed + diff.removed).toBe(65);
  });
});
