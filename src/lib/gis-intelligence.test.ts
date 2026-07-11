import { describe, it, expect } from "vitest";
import { normalizeRoadName, normalizeAddress, deduplicate, assessServiceability } from "./gis-intelligence";

describe("normalizeRoadName", () => {
  it("normalizes standard road name", () => {
    const r = normalizeRoadName("123 Main St");
    expect(r.baseName).toBe("123 Main");
    expect(r.suffix).toBe("St");
  });

  it("handles prefix", () => {
    const r = normalizeRoadName("N Lamar Blvd");
    expect(r.prefix).toBe("N");
    expect(r.baseName).toBe("Lamar");
    expect(r.suffix).toBe("Blvd");
  });

  it("handles directional suffix", () => {
    const r = normalizeRoadName("Main St NW");
    expect(r.baseName).toBe("Main");
    expect(r.suffix).toBe("St");
    expect(r.directional).toBe("NW");
    expect(r.displayName).toBe("Main St NW");
  });

  it("handles name without suffix", () => {
    const r = normalizeRoadName("FM 620");
    expect(r.baseName).toBe("FM 620");
    expect(r.suffix).toBe("");
  });
});

describe("normalizeAddress", () => {
  it("creates normalized key", () => {
    const a = normalizeAddress({ houseNumber: "100", streetName: "Main", streetType: "St", city: "Austin", state: "TX" });
    expect(a.normalizedKey).toContain("MAIN");
    expect(a.normalizedKey).toContain("AUSTIN");
    expect(a.normalizedKey).toContain("TX");
  });
});

describe("deduplicate", () => {
  it("keeps unique items", () => {
    const r = deduplicate([
      { id: "1", normalizedKey: "100|MAIN|ST|AUSTIN|TX", source: "a", confidence: 1 },
      { id: "2", normalizedKey: "200|OAK|AVE|AUSTIN|TX", source: "a", confidence: 1 },
    ]);
    expect(r.keep).toEqual(["1", "2"]);
    expect(r.remove).toHaveLength(0);
  });

  it("deduplicates exact matches", () => {
    const r = deduplicate([
      { id: "1", normalizedKey: "100|MAIN|ST|AUSTIN|TX", source: "a", confidence: 1 },
      { id: "2", normalizedKey: "100|MAIN|ST|AUSTIN|TX", source: "b", confidence: 0.9 },
    ]);
    expect(r.keep).toContain("1");
    expect(r.remove).toContain("2");
  });
});

describe("assessServiceability", () => {
  it("marks candidates as serviceable", () => {
    const r = assessServiceability([{ id: "1", hasAddress: true, isDuplicate: false }]);
    expect(r[0].status).toBe("candidate");
  });

  it("flags duplicates", () => {
    const r = assessServiceability([{ id: "1", hasAddress: true, isDuplicate: true }]);
    expect(r[0].status).toBe("duplicate");
  });

  it("flags missing addresses", () => {
    const r = assessServiceability([{ id: "1", hasAddress: false, isDuplicate: false }]);
    expect(r[0].status).toBe("needs_review");
  });
});
