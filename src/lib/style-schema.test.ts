import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateStyle, ruleSchema, styleSchema } from "./style-schema";

let idCounter = 0;
function id(): string {
  const hex = (++idCounter).toString(16).padStart(12, "0").slice(0, 12);
  return `00000000-0000-0000-0000-${hex}`;
}

describe("style schema validation", () => {
  it("accepts valid premise style", () => {
    const style = {
      id: id(),
      name: "Test Premises",
      geometryType: "point" as const,
      rules: [
        { id: id(), label: "Candidate", symbolizer: { color: "#22c55e", size: 8 } },
        { id: id(), label: "Default", symbolizer: { color: "#6b7280", size: 6 } },
      ],
    };
    const result = validateStyle(style);
    if (!result.ok) console.error("PREMISE ERRORS:", result.errors);
    expect(result.ok).toBe(true);
  });

  it("rejects empty rules", () => {
    const result = validateStyle({ id: id(), name: "Empty", geometryType: "point", rules: [] });
    expect(result.ok).toBe(false);
    expect(result.errors).toBeTruthy();
  });

  it("rejects invalid hex color", () => {
    const result = ruleSchema.safeParse({ id: id(), symbolizer: { color: "#GGG000" } });
    expect(result.success).toBe(false);
  });

  it("rejects number opacity out of range", () => {
    const result = ruleSchema.safeParse({ id: id(), symbolizer: { color: "#ff0000", opacity: 200 } });
    expect(result.success).toBe(false);
  });

  it("accepts route style with dash array", () => {
    const result = validateStyle({
      id: id(), name: "Conduit", geometryType: "line",
      rules: [{ id: id(), label: "Conduit", symbolizer: { color: "#d97706", width: 3, dashArray: [6, 3] } }],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects style with unknown keys at root (anti-injection)", () => {
    const parsed = styleSchema.safeParse({
      id: id(), name: "Test", geometryType: "point",
      rules: [{ id: id(), symbolizer: { color: "#ff0000" } }],
      eval_payload: "dangerous_code",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid label config without expression", () => {
    const result = styleSchema.safeParse({
      id: id(), name: "Good", geometryType: "point",
      rules: [{ id: id(), symbolizer: { color: "#ff0000" } }],
      labels: [{ field: "name", size: 12, color: "#ffffff" }],
    });
    expect(result.success).toBe(true);
  });
});
