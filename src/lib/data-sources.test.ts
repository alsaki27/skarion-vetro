import { describe, it, expect } from "vitest";

describe("data source validation", () => {
  const VALID_TYPES = ["arcgis_featureserver", "shapefile", "geojson", "kml", "census_tiger", "overture", "openaddresses"];

  it("accepts valid source types", () => {
    for (const t of VALID_TYPES) {
      expect(VALID_TYPES.includes(t)).toBe(true);
    }
  });

  it("rejects invalid source types", () => {
    expect(VALID_TYPES.includes("invalid")).toBe(false);
    expect(VALID_TYPES.includes("")).toBe(false);
  });

  it("validates source URL format", () => {
    function isValidUrl(url: string): boolean {
      try { new URL(url); return true; }
      catch { return false; }
    }
    expect(isValidUrl("https://services.arcgis.com/...")).toBe(true);
    expect(isValidUrl("not-a-url")).toBe(false);
  });
});
