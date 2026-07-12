import { describe, it, expect } from "vitest";
import { elementsToPlacements } from "./WorkspaceOutputs";
import type { NetworkElement } from "@/lib/types";

function makeElement(overrides: Partial<NetworkElement> & { id: string }): NetworkElement {
  return {
    type: "handhole",
    locked: false,
    position: [0, 0],
    attributes: {},
    ...overrides,
  } as NetworkElement;
}

describe("elementsToPlacements", () => {
  it("uses explicit catalog_key when set", () => {
    const el = makeElement({ id: "h1", attributes: { catalog_key: "fdh_288" } }) as NetworkElement;
    const p = elementsToPlacements({ h1: el });
    expect(p).toHaveLength(1);
    expect(p[0].catalogKey).toBe("fdh_288");
    expect(p[0].inferred).toBe(false);
  });

  it("infers catalog key from element type when no explicit key", () => {
    const el = makeElement({ id: "h2", type: "handhole" }) as NetworkElement;
    const p = elementsToPlacements({ h2: el });
    expect(p).toHaveLength(1);
    expect(p[0].catalogKey).toBe("handhole_17x30");
    expect(p[0].inferred).toBe(true);
  });

  it("does not fabricate rows for elements with no known catalog", () => {
    const el = makeElement({ id: "x1", type: "premise" }) as NetworkElement;
    const p = elementsToPlacements({ x1: el });
    expect(p).toHaveLength(0);
  });

  it("returns empty array for empty elements record", () => {
    expect(elementsToPlacements({})).toEqual([]);
  });

  it("tags all inferred rows when no explicit catalog_key", () => {
    const elements: Record<string, NetworkElement> = {
      h1: makeElement({ id: "h1", type: "handhole" }) as NetworkElement,
      c1: makeElement({ id: "c1", type: "conduit" }) as NetworkElement,
    };
    const p = elementsToPlacements(elements);
    expect(p).toHaveLength(2);
    expect(p.every((row) => row.inferred)).toBe(true);
  });
});
