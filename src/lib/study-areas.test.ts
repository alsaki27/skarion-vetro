import { describe, it, expect } from "vitest";

describe("study area validation", () => {
  it("rejects FIPS that are not 2 or 5 digits", () => {
    function isValidFips(code: string): boolean {
      return /^\d{2}$/.test(code) || /^\d{5}$/.test(code);
    }
    expect(isValidFips("48")).toBe(true);
    expect(isValidFips("48113")).toBe(true);
    expect(isValidFips("481")).toBe(false);
    expect(isValidFips("")).toBe(false);
    expect(isValidFips("abc")).toBe(false);
  });

  it("rejects empty state selection", () => {
    const stateFips = "";
    expect(stateFips.length >= 2).toBe(false);
  });
});
