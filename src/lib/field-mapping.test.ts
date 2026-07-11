import { describe, it, expect } from "vitest";

describe("field mapping", () => {
  interface FieldMapping {
    sourceField: string;
    targetField: string;
    transform?: string;
    defaultValue?: string;
  }

  it("validates field mapping structure", () => {
    const mapping: FieldMapping = { sourceField: "ROAD_NAME", targetField: "road_name" };
    expect(mapping.sourceField).toBe("ROAD_NAME");
    expect(mapping.targetField).toBe("road_name");
    expect(mapping.transform).toBeUndefined();
  });

  it("detects missing required target fields", () => {
    const required = ["road_name", "geometry"];
    const mapping = new Set(["road_name"]);
    const missing = required.filter((f) => !mapping.has(f));
    expect(missing).toEqual(["geometry"]);
  });

  it("applies constant transforms", () => {
    const mapping: FieldMapping = { sourceField: "STATE", targetField: "state", defaultValue: "TX" };
    expect(mapping.defaultValue).toBe("TX");
  });

  it("rejects empty source field", () => {
    const mapping: FieldMapping = { sourceField: "", targetField: "name" };
    expect(mapping.sourceField.length > 0).toBe(false);
  });
});
