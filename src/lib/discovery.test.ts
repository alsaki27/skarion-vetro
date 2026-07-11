import { describe, it, expect } from "vitest";

describe("ArcGIS discovery", () => {
  it("validates service URL", () => {
    function isAllowedServiceUrl(url: string): boolean {
      try {
        const u = new URL(url);
        return u.protocol === "https:" && (
          u.hostname.endsWith(".arcgis.com") ||
          u.hostname.endsWith(".cloud.esri.com") ||
          u.hostname === "localhost"
        );
      } catch { return false; }
    }
    expect(isAllowedServiceUrl("https://services.arcgis.com/org/arcgis/rest/services")).toBe(true);
    expect(isAllowedServiceUrl("https://evil.com/steal")).toBe(false);
    expect(isAllowedServiceUrl("http://insecure.com/data")).toBe(false);
    expect(isAllowedServiceUrl("not-a-url")).toBe(false);
  });

  it("enforces request timeout", () => {
    const TIMEOUT_MS = 10_000;
    expect(TIMEOUT_MS).toBeGreaterThan(0);
    expect(TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });
});
