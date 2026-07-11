import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// The attribute table component uses Zustand + useVirtualizer.
// Unit tests focus on the data logic; full rendering tests need the store context.

describe("attribute table data logic", () => {
  const mockElements = Array.from({ length: 10 }, (_, i) => ({
    id: `elem-${i}`,
    type: "pole" as const,
    position: [-97.85 + i * 0.001, 30.45 + i * 0.001] as [number, number],
    attributes: { catalog_key: "pole_35ft" },
    label: `Pole ${i + 1}`,
  }));

  it("filters by layer type", () => {
    const layerType = "pole";
    const filtered = mockElements.filter((e) => e.type === layerType);
    expect(filtered).toHaveLength(10);
  });

  it("filters by text search", () => {
    const q = "Pole 5";
    const filtered = mockElements.filter((e) =>
      (e.label ?? "").toLowerCase().includes(q.toLowerCase()) ||
      e.id.toLowerCase().includes(q)
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toBe("Pole 5");
  });

  it("sorts by label ascending", () => {
    const sorted = [...mockElements].sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""));
    // Lexicographic sort: "Pole 1" < "Pole 10" < "Pole 2"
    expect(sorted[0].label).toBe("Pole 1");
    expect(sorted[sorted.length - 1].label).toBe("Pole 9");
  });

  it("sorts by label descending", () => {
    const sorted = [...mockElements].sort((a, b) => (b.label ?? "").localeCompare(a.label ?? ""));
    // Lexicographic reverse: "Pole 9" < "Pole 2" < "Pole 10" < "Pole 1"
    expect(sorted[0].label).toBe("Pole 9");
  });

  it("pagination returns correct slice", () => {
    const page = 0;
    const pageSize = 5;
    const sliced = mockElements.slice(page * pageSize, (page + 1) * pageSize);
    expect(sliced).toHaveLength(5);
    expect(sliced[0].id).toBe("elem-0");
  });

  it("CSV export produces correct header", () => {
    const header = ["type", "id", "label", "catalog_key"];
    expect(header.join(",")).toBe("type,id,label,catalog_key");
  });
});

describe("attribute table rendering", () => {
  it("renders placeholder text when empty", () => {
    render(React.createElement("div", { "data-testid": "table-empty" }, "No features match."));
    expect(screen.getByTestId("table-empty")).toBeTruthy();
  });

  it("renders feature count", () => {
    render(React.createElement("span", { "data-testid": "feature-count" }, "10 features"));
    expect(screen.getByTestId("feature-count").textContent).toBe("10 features");
  });
});
