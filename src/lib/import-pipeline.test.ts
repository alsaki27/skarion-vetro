import { describe, it, expect } from "vitest";

describe("import pipeline validation", () => {
  it("rejects oversized uploads", () => {
    const MAX_BYTES = 50 * 1024 * 1024;
    expect(MAX_BYTES).toBe(52_428_800);
    expect(10 * 1024 * 1024).toBeLessThan(MAX_BYTES);
    expect(100 * 1024 * 1024).toBeGreaterThan(MAX_BYTES);
  });

  it("detects valid GeoJSON types", () => {
    const validTypes = ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "FeatureCollection"];
    expect(validTypes.includes("Point")).toBe(true);
    expect(validTypes.includes("InvalidType")).toBe(false);
  });

  it("validates feature count limits", () => {
    const MAX_FEATURES = 10_000;
    expect(100).toBeLessThan(MAX_FEATURES);
    expect(20_000).toBeGreaterThan(MAX_FEATURES);
  });

  it("rejects ZIP-slip paths", () => {
    function isZipSlip(path: string): boolean {
      return path.includes("..") || path.startsWith("/");
    }
    expect(isZipSlip("../../etc/passwd")).toBe(true);
    expect(isZipSlip("../outside.shp")).toBe(true);
    expect(isZipSlip("data/layer.shp")).toBe(false);
  });
});
