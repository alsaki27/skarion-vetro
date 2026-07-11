import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("test floor gate", () => {
  it("tests/.test-floor file exists and is parseable", () => {
    const floorPath = path.resolve(__dirname, "../../tests/.test-floor");
    const exists = fs.existsSync(floorPath);
    expect(exists).toBe(true);
    const content = fs.readFileSync(floorPath, "utf-8").trim();
    const floor = Number(content);
    expect(Number.isFinite(floor)).toBe(true);
    expect(floor).toBeGreaterThan(0);
  });
});
